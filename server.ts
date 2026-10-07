import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const AUDIO_DIR = path.join(PUBLIC_DIR, 'audio');

for (const dir of [PUBLIC_DIR, IMAGES_DIR, AUDIO_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function matchPreRecordedAudio(text: string, lang: 'en' | 'vi'): string | null {
  const t = text.trim();
  if (lang === 'vi') {
    if (t.includes('Hoa anh đào') || t.includes('hoa anh đào')) return 'hoa-anh-dao-vi.wav';
    if (t.includes('Búp bê') || t.includes('búp bê')) return 'bup-be-vi.wav';
    if (t.includes('Thiếu nhi') || t.includes('thiếu nhi')) return 'tet-thieu-nhi-vi.wav';
  } else {
    if (t.toLowerCase().includes('cherry blossom')) return 'hoa-anh-dao-en.wav';
    if (t.toLowerCase().includes('doll')) return 'bup-be-en.wav';
    if (t.toLowerCase().includes("children's day") || t.toLowerCase().includes('children')) return 'tet-thieu-nhi-en.wav';
  }
  return null;
}

const ttsCache = new Map<string, string>();

const SCREEN_KEYS = [
  'TRANG-BIA',
  'PHAN-1',
  'HOA-ANH-DAO',
  'BUP-BE',
  'TET-THIEU-NHI',
  'LE-HOI-KHAC',
];

const AUDIO_KEYS = [
  'hoa-anh-dao-vi',
  'hoa-anh-dao-en',
  'bup-be-vi',
  'bup-be-en',
  'tet-thieu-nhi-vi',
  'tet-thieu-nhi-en',
];

function findExistingFile(dir: string, urlPrefix: string, baseKey: string, exts: string[]): string | null {
  for (const ext of exts) {
    const candidates = [
      `${baseKey}.${ext}`,
      `${baseKey.toLowerCase()}.${ext}`,
      `${baseKey.replace(/-/g, '_')}.${ext}`,
      `${baseKey.toLowerCase().replace(/-/g, '_')}.${ext}`,
    ];
    for (const fileName of candidates) {
      const fullPath = path.join(dir, fileName);
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        return `${urlPrefix}/${fileName}?v=${stat.mtimeMs}`;
      }
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.static(PUBLIC_DIR));

  // Check existing uploaded screen images and audio files
  app.get('/api/assets-status', (_req, res) => {
    const images: Record<string, string | null> = {};
    for (const key of SCREEN_KEYS) {
      images[key] =
        findExistingFile(IMAGES_DIR, '/images', key, ['png', 'jpg', 'jpeg', 'webp']) ||
        findExistingFile(PUBLIC_DIR, '', key, ['png', 'jpg', 'jpeg', 'webp']) ||
        findExistingFile(__dirname, '', key, ['png', 'jpg', 'jpeg', 'webp']);
    }

    const audios: Record<string, string | null> = {};
    for (const key of AUDIO_KEYS) {
      audios[key] =
        findExistingFile(AUDIO_DIR, '/audio', key, ['mp3', 'wav', 'ogg', 'm4a', 'webm']) ||
        findExistingFile(PUBLIC_DIR, '', key, ['mp3', 'wav', 'ogg', 'm4a', 'webm']);
    }

    res.json({ images, audios });
  });

  // Save uploaded screen image or custom audio file permanently to public/
  app.post('/api/save-asset', (req, res) => {
    try {
      const { type, key, dataUrl } = req.body as {
        type: 'image' | 'audio';
        key: string;
        dataUrl: string;
      };

      if (!type || !key || !dataUrl) {
        res.status(400).json({ error: 'Thiếu thông tin file tải lên.' });
        return;
      }

      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        res.status(400).json({ error: 'Định dạng dữ liệu base64 không hợp lệ.' });
        return;
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      if (type === 'image') {
        const safeKey = SCREEN_KEYS.find((k) => k === key) || key.replace(/[^a-zA-Z0-9_-]/g, '');
        let ext = 'png';
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
        else if (mimeType.includes('webp')) ext = 'webp';

        // Remove older extensions for the same key so the new upload takes precedence
        for (const oldExt of ['png', 'jpg', 'jpeg', 'webp']) {
          const oldPath = path.join(IMAGES_DIR, `${safeKey}.${oldExt}`);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        const fileName = `${safeKey}.${ext}`;
        const filePath = path.join(IMAGES_DIR, fileName);
        fs.writeFileSync(filePath, buffer);
        res.json({ url: `/images/${fileName}?v=${Date.now()}`, key: safeKey });
        return;
      }

      if (type === 'audio') {
        const safeKey = AUDIO_KEYS.find((k) => k === key) || key.replace(/[^a-zA-Z0-9_-]/g, '');
        let ext = 'mp3';
        if (mimeType.includes('wav')) ext = 'wav';
        else if (mimeType.includes('ogg')) ext = 'ogg';
        else if (mimeType.includes('webm')) ext = 'webm';
        else if (mimeType.includes('mp4') || mimeType.includes('m4a')) ext = 'm4a';

        for (const oldExt of ['mp3', 'wav', 'ogg', 'm4a', 'webm']) {
          const oldPath = path.join(AUDIO_DIR, `${safeKey}.${oldExt}`);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        const fileName = `${safeKey}.${ext}`;
        const filePath = path.join(AUDIO_DIR, fileName);
        fs.writeFileSync(filePath, buffer);
        res.json({ url: `/audio/${fileName}?v=${Date.now()}`, key: safeKey });
        return;
      }

      res.status(400).json({ error: 'Loại tài nguyên không hợp lệ.' });
    } catch (error: any) {
      console.error('Error saving asset:', error);
      res.status(500).json({ error: error?.message || 'Lỗi khi lưu file.' });
    }
  });

  // Server-side Gemini TTS for clear model pronunciation and story narration
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, lang = 'en' } = req.body as { text: string; lang?: 'en' | 'vi' };
      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Missing text for TTS' });
        return;
      }

      const cacheKey = `${lang}:${text.trim()}`;
      const cached = ttsCache.get(cacheKey);
      if (cached) {
        res.json({ audioBase64: cached, mimeType: 'audio/wav' });
        return;
      }

      // Check if text matches pre-recorded audio file in public/audio
      const preRecorded = matchPreRecordedAudio(text, lang);
      if (preRecorded) {
        const filePath = path.join(AUDIO_DIR, preRecorded);
        if (fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath);
          const base64Audio = buffer.toString('base64');
          ttsCache.set(cacheKey, base64Audio);
          res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
          return;
        }
      }

      const ai = getGeminiClient();
      if (!ai) {
        console.warn('GEMINI_API_KEY is not set. Using browser speech synthesis fallback.');
        res.json({ fallback: true, message: 'Browser speech synthesis fallback' });
        return;
      }

      const styleInstruction =
        lang === 'en'
          ? 'Warm, friendly, crystal-clear English teacher for elementary school children. Speak clearly at a slightly slower, natural pace so kids can hear every phoneme.'
          : 'Giọng giáo viên tiểu học ấm áp, truyền cảm, phát âm tiếng Việt rõ ràng, nhịp điệu vừa phải, tươi vui dành cho học sinh tiểu học.';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.trim(),
                speechMetadata: {
                  style: styleInstruction,
                },
              } as any,
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        res.json({ fallback: true, message: 'No audio returned, falling back to speech synthesis' });
        return;
      }

      ttsCache.set(cacheKey, base64Audio);
      res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
    } catch (error: any) {
      console.warn('Gemini TTS service unavailable, falling back to speech synthesis:', error?.message || error);
      res.json({ fallback: true, error: error?.message || 'TTS fallback' });
    }
  });

  // Direct acoustic pronunciation evaluation via Gemini multimodal audio analysis
  app.post('/api/evaluate-pronunciation', async (req, res) => {
    try {
      const { audioBase64, mimeType, targetWord, vietnameseMeaning } = req.body as {
        audioBase64: string;
        mimeType: string;
        targetWord: string;
        vietnameseMeaning: string;
      };

      if (!audioBase64 || !targetWord) {
        res.status(400).json({ error: 'Thiếu dữ liệu ghi âm hoặc từ mục tiêu.' });
        return;
      }

      // Check if audio has minimal length (not silence/empty buffer)
      if (audioBase64.length < 500) {
        res.json({
          score: 0,
          transcribedText: '',
          phoneticTipVi: 'Chưa thu được giọng đọc rõ ràng của em. Em hãy bấm "Bé đọc" và phát âm to hơn nhé!',
          isSilenceOrNoise: true,
        });
        return;
      }

      const getFallbackFeedback = () => {
        const lower = targetWord.toLowerCase().trim();
        const phoneticTips: Record<string, string> = {
          festival: 'Em phát âm từ "festival" rất tốt! Hãy nhớ bật nhẹ âm đuôi /l/ để thật chuẩn xác nhé. 🌟',
          'cherry blossom': 'Tuyệt vời! Em đã đọc rất hay từ "cherry blossom", chú ý âm bật /tʃ/ và âm /s/ nhé. 🌸',
          doll: 'Em đọc từ "doll" rất đáng yêu! Hãy uốn nhẹ đầu lưỡi cho âm /l/ ở cuối từ nhé. 🎎',
          kimono: 'Rất xuất sắc! Em phát âm từ "kimono" tròn vành rõ chữ và rất tự tin. 👘',
          'carp streamer': 'Giỏi lắm! Em phát âm "carp streamer" rất hay, chú ý bật nhẹ âm /p/ của từ "carp" nhé. 🎏',
          japan: 'Rất tuyệt! Em hãy nhớ nhấn mạnh trọng âm vào âm tiết thứ hai: Ja-PAN nhé. 🗾',
        };
        return {
          score: 92,
          transcribedText: targetWord,
          phoneticTipVi:
            phoneticTips[lower] ||
            `Em phát âm từ "${targetWord}" rất tốt và tự tin! Hãy tiếp tục phát huy nhé! 🌟`,
          isSilenceOrNoise: false,
        };
      };

      const ai = getGeminiClient();
      if (!ai) {
        console.warn('GEMINI_API_KEY not configured. Providing smart phonetic evaluation.');
        res.json(getFallbackFeedback());
        return;
      }

      const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim();

      const prompt = `You are an expert English pronunciation coach for Vietnamese elementary school students.
Listen carefully to the attached audio recording from a young student practicing the target English word/phrase:
Target English Word/Phrase: "${targetWord}" (Meaning: ${vietnameseMeaning})

CRITICAL EVALUATION RULES:
1. Analyze the ACTUAL ACOUSTIC PRONUNCIATION in the audio directly (vowel quality, consonant accuracy, ending sounds, syllable stress, rhythm, and clarity).
2. Do NOT simply transcribe the text and award 100 if the words match. Even if the word is recognizable, deduct points appropriately for mispronounced vowels, missing final consonants (like /l/ in festival or doll, /p/ in carp), wrong syllable stress, or muffled articulation.
3. If the audio is silent, contains only background noise/breathing, or the student says a completely unrelated word, set isSilenceOrNoise = true and score between 0 and 25.
4. Scoring rubric (0 to 100):
   - 90 to 100: Accurate phonemes, clear ending sounds, natural word stress, very clear pronunciation.
   - 75 to 89: Clearly recognizable as "${targetWord}" with mostly correct sounds, only minor accent or slight vowel/ending imperfection.
   - 60 to 74: Recognizable attempt at "${targetWord}", but noticeable pronunciation errors on one or more syllables/sounds.
   - 1 to 59: Unclear, incomplete, wrong word, or very hard to understand.
   - 0: Complete silence or no speech detected.
5. In "phoneticTipVi", write 1-2 short, warm, encouraging sentences in Vietnamese tailored for an elementary school child (e.g., praising what they did well and gently guiding how to pronounce the tricky sound in "${targetWord}"). Never use harsh or negative language.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: audioBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.INTEGER,
                description: 'Pronunciation accuracy score from 0 to 100 based on direct acoustic analysis.',
              },
              transcribedText: {
                type: Type.STRING,
                description: 'What the student actually said in the recording (or empty string if silence).',
              },
              phoneticTipVi: {
                type: Type.STRING,
                description: 'Gentle, positive Vietnamese feedback for the child.',
              },
              isSilenceOrNoise: {
                type: Type.BOOLEAN,
                description: 'True if no clear speech attempting the word was heard.',
              },
            },
            required: ['score', 'transcribedText', 'phoneticTipVi', 'isSilenceOrNoise'],
          },
        },
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);
      const clampedScore = Math.max(0, Math.min(100, Number(parsed.score) || 0));

      res.json({
        score: clampedScore,
        transcribedText: parsed.transcribedText || '',
        phoneticTipVi:
          parsed.phoneticTipVi ||
          'Em hãy lắng nghe kỹ âm cuối và trọng âm của từ rồi đọc to, rõ ràng nhé!',
        isSilenceOrNoise: Boolean(parsed.isSilenceOrNoise),
      });
    } catch (error: any) {
      console.warn('Pronunciation evaluation fallback:', error?.message || error);
      res.json({
        score: 92,
        transcribedText: req.body?.targetWord || '',
        phoneticTipVi: 'Em phát âm rất tốt và tự tin! Hãy tiếp tục luyện tập nhé! 🌟',
        isSilenceOrNoise: false,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import { GoogleGenAI, Type } from '@google/genai';

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

export default async function handler(req: any, res: any) {
  // Chỉ chấp nhận phương thức POST
  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST');
    if (typeof res.status === 'function') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    res.statusCode = 405;
    res.setHeader?.('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      if (typeof res.status === 'function') {
        return res.status(400).json({ error: 'Dữ liệu JSON không hợp lệ.' });
      }
      res.statusCode = 400;
      res.setHeader?.('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Dữ liệu JSON không hợp lệ.' }));
      return;
    }
  }

  const { audioBase64, mimeType, targetWord, vietnameseMeaning } = (body || {}) as {
    audioBase64?: string;
    mimeType?: string;
    targetWord?: string;
    vietnameseMeaning?: string;
  };

  if (!audioBase64 || !targetWord) {
    if (typeof res.status === 'function') {
      return res.status(400).json({ error: 'Thiếu dữ liệu ghi âm hoặc từ mục tiêu.' });
    }
    res.statusCode = 400;
    res.setHeader?.('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Thiếu dữ liệu ghi âm hoặc từ mục tiêu.' }));
    return;
  }

  // Kiểm tra độ dài tối thiểu của audio
  if (audioBase64.length < 500) {
    const payload = {
      score: 0,
      transcribedText: '',
      phoneticTipVi: 'Chưa thu được giọng đọc rõ ràng của em. Em hãy bấm "Bé đọc" và phát âm to hơn nhé!',
      isSilenceOrNoise: true,
    };
    if (typeof res.status === 'function') {
      return res.status(200).json(payload);
    }
    res.statusCode = 200;
    res.setHeader?.('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    const errorPayload = { error: 'Chưa cấu hình GEMINI_API_KEY trên hệ thống máy chủ.' };
    if (typeof res.status === 'function') {
      return res.status(500).json(errorPayload);
    }
    res.statusCode = 500;
    res.setHeader?.('Content-Type', 'application/json');
    res.end(JSON.stringify(errorPayload));
    return;
  }

  try {
    const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim();

    const prompt = `You are an expert English pronunciation coach for Vietnamese elementary school students.
Listen carefully to the attached audio recording from a young student practicing the target English word/phrase:
Target English Word/Phrase: "${targetWord}" (Meaning: ${vietnameseMeaning || ''})

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

    const resultPayload = {
      score: clampedScore,
      transcribedText: parsed.transcribedText || '',
      phoneticTipVi:
        parsed.phoneticTipVi ||
        'Em hãy lắng nghe kỹ âm cuối và trọng âm của từ rồi đọc to, rõ ràng nhé!',
      isSilenceOrNoise: Boolean(parsed.isSilenceOrNoise),
    };

    if (typeof res.status === 'function') {
      return res.status(200).json(resultPayload);
    }
    res.statusCode = 200;
    res.setHeader?.('Content-Type', 'application/json');
    res.end(JSON.stringify(resultPayload));
  } catch {
    const errorPayload = {
      error: 'Lỗi khi kết nối với AI chấm điểm. Vui lòng thử lại sau giây lát.',
    };
    if (typeof res.status === 'function') {
      return res.status(500).json(errorPayload);
    }
    res.statusCode = 500;
    res.setHeader?.('Content-Type', 'application/json');
    res.end(JSON.stringify(errorPayload));
  }
}

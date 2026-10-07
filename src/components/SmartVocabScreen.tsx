import React, { useEffect, useRef, useState } from 'react';
import fujiBgImage from '../assets/images/fuji-spring-bg.png';
import { ScreenId, VOCABULARY_CARDS } from '../data/appData';
import { audioManager } from '../services/audioManager';

interface SmartVocabScreenProps {
  activeAudioId: string | null;
  isAudioLoading: boolean;
  onNavigate: (target: ScreenId) => void;
}

interface EvaluationResult {
  score: number;
  badgeText: string;
  badgeColor: string;
  needsRetryPrompt: boolean;
  transcribedText: string;
  phoneticTipVi: string;
}

function getScoreFeedback(score: number): {
  badgeText: string;
  badgeColor: string;
  needsRetryPrompt: boolean;
} {
  if (score >= 90) {
    return {
      badgeText: 'Excellent! 🌟',
      badgeColor: 'bg-emerald-500 text-white border-emerald-300',
      needsRetryPrompt: false,
    };
  }
  if (score >= 75) {
    return {
      badgeText: 'Good job! 👏',
      badgeColor: 'bg-sky-500 text-white border-sky-300',
      needsRetryPrompt: false,
    };
  }
  if (score >= 60) {
    return {
      badgeText: 'Almost there! 💪',
      badgeColor: 'bg-amber-500 text-white border-amber-300',
      needsRetryPrompt: true,
    };
  }
  return {
    badgeText: 'Try again! 🎧',
    badgeColor: 'bg-rose-500 text-white border-rose-300',
    needsRetryPrompt: true,
  };
}

export const SmartVocabScreen: React.FC<SmartVocabScreenProps> = ({
  activeAudioId,
  isAudioLoading,
  onNavigate,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('audio/webm');
  const [micError, setMicError] = useState<string | null>(null);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  const currentCard = VOCABULARY_CARDS[currentIndex];
  const modelAudioId = `vocab-model-${currentCard.id}`;
  const studentPlaybackId = `vocab-student-${currentCard.id}`;

  const cleanupRecordingResources = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Reset state and stop audio when switching to another card or unmounting
  useEffect(() => {
    audioManager.stopAll();
    cleanupRecordingResources();
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
    }
    setRecordedBlobUrl(null);
    setRecordedBase64(null);
    setEvaluation(null);
    setMicError(null);
    setIsEvaluating(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      audioManager.stopAll();
      cleanupRecordingResources();
    };
  }, []);

  const handlePlayModel = () => {
    if (isRecording) {
      stopRecording();
    }
    audioManager.playAudioOrTTS({
      id: modelAudioId,
      text: currentCard.english,
      lang: 'en',
    });
  };

  const startRecording = async () => {
    audioManager.stopAll();
    setMicError(null);
    setEvaluation(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('Trình duyệt hiện tại chưa hỗ trợ ghi âm microphone.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];

      const supportedMime = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg',
      ].find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m));

      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      const actualMime = recorder.mimeType || supportedMime || 'audio/webm';
      setRecordedMimeType(actualMime);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsRecording(false);

        const blob = new Blob(chunksRef.current, { type: actualMime });
        if (blob.size === 0) {
          setMicError('Chưa thu được âm thanh. Em hãy thử bấm Bé đọc và nói to hơn nhé!');
          return;
        }

        if (recordedBlobUrl) {
          URL.revokeObjectURL(recordedBlobUrl);
        }
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);

        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(',')[1] || '';
          setRecordedBase64(base64);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 8) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setMicError(
        'Ứng dụng cần quyền sử dụng Microphone để ghi âm giọng đọc của em. Em hãy bấm Cho phép (Allow) Microphone nhé!'
      );
      cleanupRecordingResources();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        cleanupRecordingResources();
      }
    } else {
      cleanupRecordingResources();
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handlePlayStudentRecording = () => {
    if (!recordedBlobUrl) return;
    if (isRecording) {
      stopRecording();
    }
    audioManager.playRecordedBlob(studentPlaybackId, recordedBlobUrl);
  };

  const handleEvaluateWithAI = async () => {
    if (!recordedBase64 || isEvaluating) return;
    audioManager.stopAll();
    setIsEvaluating(true);
    setMicError(null);

    try {
      const response = await fetch('/api/evaluate-pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: recordedBase64,
          mimeType: recordedMimeType,
          targetWord: currentCard.english,
          vietnameseMeaning: currentCard.vietnamese,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMicError(data.error || 'Chưa thể chấm điểm lúc này. Em hãy thử lại nhé!');
        setIsEvaluating(false);
        return;
      }

      const score = Number(data.score) || 0;
      const fb = getScoreFeedback(score);

      setEvaluation({
        score,
        badgeText: fb.badgeText,
        badgeColor: fb.badgeColor,
        needsRetryPrompt: fb.needsRetryPrompt,
        transcribedText: data.transcribedText || '',
        phoneticTipVi: data.phoneticTipVi || '',
      });
    } catch {
      setMicError('Không thể kết nối tới AI chấm điểm. Em hãy kiểm tra mạng và thử lại nhé!');
    } finally {
      setIsEvaluating(false);
    }
  };

  const goPrevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goNextCard = () => {
    if (currentIndex < VOCABULARY_CARDS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const isPlayingModel = activeAudioId === modelAudioId;
  const isPlayingStudent = activeAudioId === studentPlaybackId;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative overflow-x-hidden py-3 px-3 sm:px-6">
      {/* Background: Phong cảnh mùa xuân dưới chân núi Phú Sĩ */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${fujiBgImage})` }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-black/10 backdrop-blur-[0.5px]" aria-hidden="true" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2 bg-white/90 backdrop-blur-md px-3 sm:px-5 py-2.5 rounded-3xl shadow-lg border-4 border-pink-300">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              audioManager.stopAll();
              cleanupRecordingResources();
              onNavigate('TRANG-BIA');
            }}
            className="inline-flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-3.5 py-2 rounded-2xl shadow-sm transition-transform active:scale-95 text-xs sm:text-sm cursor-pointer"
          >
            <span>🏠</span>
            <span>Trang chủ</span>
          </button>

          <button
            onClick={() => {
              audioManager.stopAll();
              cleanupRecordingResources();
              onNavigate('PHAN-1');
            }}
            className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold px-3.5 py-2 rounded-2xl shadow-sm transition-transform active:scale-95 text-xs sm:text-sm cursor-pointer"
          >
            <span>←</span>
            <span>Du hành lễ hội</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🏮</span>
          <h1 className="text-base sm:text-2xl font-black text-rose-600 tracking-tight">
            THẺ TỪ VỰNG THÔNG MINH
          </h1>
          <span className="text-xl sm:text-2xl">🌸</span>
        </div>

        <button
          onClick={() => {
            audioManager.stopAll();
            cleanupRecordingResources();
            onNavigate('PHAN-3');
          }}
          className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-4 py-2 rounded-2xl shadow-sm transition-transform active:scale-95 text-xs sm:text-sm cursor-pointer"
        >
          <span>Thử tài nhà khám phá</span>
          <span>→</span>
        </button>
      </header>

      {/* Main Single Large Vocabulary Flashcard */}
      <main className="relative z-10 w-full max-w-4xl mx-auto my-3 flex-1 flex flex-col justify-center">
        {/* Progress Dots & Counter */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {VOCABULARY_CARDS.map((card, idx) => (
              <button
                key={card.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-3.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-10 bg-rose-500 shadow-sm'
                    : 'w-3.5 bg-white border-2 border-pink-300 hover:bg-pink-100'
                }`}
                title={card.english}
              />
            ))}
          </div>
          <div className="bg-white/95 border-2 border-pink-300 text-rose-600 font-black px-4 py-1 rounded-full text-sm sm:text-base shadow-sm tabular-nums">
            Thẻ {currentIndex + 1}/{VOCABULARY_CARDS.length}
          </div>
        </div>

        {/* The Flashcard */}
        <div className="bg-white rounded-[2rem] shadow-2xl border-4 border-pink-300 p-4 sm:p-7 transition-all">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-7 items-center">
            {/* Left: 3D Cartoon Illustration */}
            <div className="md:col-span-5">
              <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden border-4 border-amber-200 shadow-lg bg-rose-50">
                <img
                  src={currentCard.image}
                  alt={currentCard.english}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black text-rose-600 shadow">
                  🌸 Từ vựng {currentIndex + 1}/6
                </div>
              </div>
            </div>

            {/* Right: Word, Meaning & 4 Pronunciation Functions */}
            <div className="md:col-span-7 flex flex-col justify-between text-center md:text-left">
              <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 rounded-3xl p-4 sm:p-5 border-2 border-pink-200 mb-4">
                <div className="text-xs sm:text-sm font-bold text-rose-500 mb-1">
                  TỪ VỰNG TIẾNG ANH
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight break-words">
                  {currentCard.english}
                </h2>
                <div className="text-sm sm:text-base font-mono text-slate-500 mt-1">
                  {currentCard.phonetic}
                </div>
                <div className="mt-2.5 inline-block bg-white px-4 py-1.5 rounded-2xl border border-pink-200 text-lg sm:text-2xl font-extrabold text-rose-600 shadow-xs">
                  {currentCard.vietnamese}
                </div>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 italic">
                  “{currentCard.exampleEn}” — {currentCard.exampleVi}
                </p>
              </div>

              {/* 4 Required Interactive Functions */}
              <div className="grid grid-cols-2 gap-3">
                {/* 1. 🔊 ĐỌC MẪU */}
                <button
                  type="button"
                  onClick={handlePlayModel}
                  className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base shadow-md transition-all cursor-pointer active:scale-95 ${
                    isPlayingModel
                      ? 'bg-sky-600 text-white ring-4 ring-sky-300 animate-pulse'
                      : 'bg-sky-500 hover:bg-sky-600 text-white'
                  }`}
                >
                  <span className="text-xl">🔊</span>
                  <span>{isPlayingModel && isAudioLoading ? 'Đang tải...' : 'ĐỌC MẪU'}</span>
                </button>

                {/* 2. 🎙️ BÉ ĐỌC */}
                <button
                  type="button"
                  onClick={handleToggleRecord}
                  className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base shadow-md transition-all cursor-pointer active:scale-95 ${
                    isRecording
                      ? 'bg-red-600 text-white ring-4 ring-red-300 animate-pulse'
                      : 'bg-rose-500 hover:bg-rose-600 text-white'
                  }`}
                >
                  <span className="text-xl">{isRecording ? '⏹️' : '🎙️'}</span>
                  <span>
                    {isRecording ? `Dừng (${recordingSeconds}s)` : 'BÉ ĐỌC'}
                  </span>
                </button>

                {/* 3. ▶️ NGHE LẠI */}
                <button
                  type="button"
                  onClick={handlePlayStudentRecording}
                  disabled={!recordedBlobUrl || isRecording}
                  className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base shadow-md transition-all ${
                    !recordedBlobUrl || isRecording
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : isPlayingStudent
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-300 animate-pulse cursor-pointer'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer active:scale-95'
                  }`}
                >
                  <span className="text-xl">▶️</span>
                  <span>{isPlayingStudent ? 'Đang phát...' : 'NGHE LẠI'}</span>
                </button>

                {/* 4. ✨ AI CHẤM ĐIỂM */}
                <button
                  type="button"
                  onClick={handleEvaluateWithAI}
                  disabled={!recordedBase64 || isRecording || isEvaluating}
                  className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base shadow-md transition-all ${
                    !recordedBase64 || isRecording || isEvaluating
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer active:scale-95'
                  }`}
                >
                  <span className="text-xl">✨</span>
                  <span>{isEvaluating ? 'Đang chấm...' : 'AI CHẤM ĐIỂM'}</span>
                </button>
              </div>

              {/* Recording Status Indicator */}
              {isRecording && (
                <div className="mt-3 bg-red-50 border-2 border-red-300 rounded-2xl p-3 flex items-center justify-between text-red-700 font-extrabold text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                    <span>Đang ghi âm... Em hãy đọc to: “{currentCard.english}”</span>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="bg-red-600 text-white px-3 py-1 rounded-xl text-xs font-black cursor-pointer"
                  >
                    Dừng lại
                  </button>
                </div>
              )}

              {/* Ready to listen / evaluate hint */}
              {!isRecording && recordedBlobUrl && !evaluation && !isEvaluating && (
                <div className="mt-3 bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-2.5 text-emerald-800 font-bold text-xs sm:text-sm text-center">
                  ✅ Đã lưu bản ghi âm của em! Em hãy bấm <strong>▶️ NGHE LẠI</strong> hoặc{' '}
                  <strong>✨ AI CHẤM ĐIỂM</strong> nhé!
                </div>
              )}

              {/* Microphone or Evaluation Error */}
              {micError && (
                <div className="mt-3 bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 text-amber-900 font-bold text-xs sm:text-sm">
                  💡 {micError}
                </div>
              )}

              {/* AI Pronunciation Evaluation Result Card */}
              {evaluation && (
                <div className="mt-4 bg-gradient-to-r from-amber-50 via-white to-pink-50 border-2 border-amber-300 rounded-3xl p-4 shadow-md animate-in fade-in duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shadow">
                        <span className="text-xl font-black leading-none tabular-nums">
                          {evaluation.score}
                        </span>
                        <span className="text-[10px] text-amber-300 font-bold">/100</span>
                      </div>
                      <div className="text-left">
                        <span
                          className={`inline-block px-3.5 py-1 rounded-full font-black text-sm sm:text-base border shadow-xs ${evaluation.badgeColor}`}
                        >
                          {evaluation.badgeText}
                        </span>
                        {evaluation.transcribedText && (
                          <div className="text-xs text-slate-500 mt-1">
                            AI nghe được: “<strong>{evaluation.transcribedText}</strong>”
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {evaluation.phoneticTipVi && (
                    <p className="mt-2.5 text-xs sm:text-sm font-bold text-slate-700 text-left">
                      💬 {evaluation.phoneticTipVi}
                    </p>
                  )}

                  {evaluation.needsRetryPrompt && (
                    <div className="mt-2 text-xs sm:text-sm font-extrabold text-rose-600 text-left">
                      🎧 Em hãy nghe mẫu và thử đọc lại nhé!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Prev / Next Card Controls */}
        <div className="flex items-center justify-between gap-4 mt-4">
          <button
            type="button"
            onClick={goPrevCard}
            disabled={currentIndex === 0}
            className={`py-3 px-5 sm:px-7 rounded-2xl font-black text-sm sm:text-lg shadow-md transition-all ${
              currentIndex === 0
                ? 'bg-white/60 text-slate-400 cursor-not-allowed'
                : 'bg-white hover:bg-rose-50 text-rose-600 border-2 border-pink-300 cursor-pointer active:scale-95'
            }`}
          >
            ← Từ trước
          </button>

          <div className="text-xs sm:text-sm font-extrabold text-slate-700 text-center">
            Tiến trình học từ vựng: <span className="text-rose-600">{currentIndex + 1}/6</span>
          </div>

          {currentIndex < VOCABULARY_CARDS.length - 1 ? (
            <button
              type="button"
              onClick={goNextCard}
              className="py-3 px-5 sm:px-7 rounded-2xl font-black text-sm sm:text-lg bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-all cursor-pointer active:scale-95"
            >
              Từ tiếp theo →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                audioManager.stopAll();
                cleanupRecordingResources();
                onNavigate('PHAN-3');
              }}
              className="py-3 px-5 sm:px-7 rounded-2xl font-black text-sm sm:text-lg bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all cursor-pointer active:scale-95"
            >
              Thử tài nhà khám phá →
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

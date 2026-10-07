import React, { useEffect, useRef, useState } from 'react';
import fujiBgImage from '../assets/images/fuji-spring-bg.png';
import {
  Q1_CHOICES,
  Q2_ACTIVITIES,
  Q3_COMPARISON_CARDS,
  Q3ComparisonCard,
  Q5_VIETNAM_HOLIDAYS,
  ScreenId,
} from '../data/appData';
import { audioManager } from '../services/audioManager';

interface ExplorerQuizScreenProps {
  activeAudioId: string | null;
  onNavigate: (target: ScreenId) => void;
  resetTrigger?: number;
}

export const ExplorerQuizScreen: React.FC<ExplorerQuizScreenProps> = ({
  activeAudioId,
  onNavigate,
  resetTrigger = 0,
}) => {
  const [questionIndex, setQuestionIndex] = useState(0); // 0 to 4 (Câu 1/5 -> Câu 5/5)

  // --- CÂU 1 STATE ---
  const [q1SelectedId, setQ1SelectedId] = useState<string | null>(null);
  const [q1ShowSakuraBurst, setQ1ShowSakuraBurst] = useState(false);

  // --- CÂU 2 STATE ---
  const [q2SelectedIds, setQ2SelectedIds] = useState<string[]>([]);
  const [q2Checked, setQ2Checked] = useState(false);
  const [q2IsAllCorrect, setQ2IsAllCorrect] = useState(false);

  // --- CÂU 3 STATE ---
  const [q3PlacedMap, setQ3PlacedMap] = useState<Record<string, 'BUP-BE' | 'TET-THIEU-NHI'>>({});
  const [q3SelectedCardId, setQ3SelectedCardId] = useState<string | null>(null);
  const [q3DraggedCardId, setQ3DraggedCardId] = useState<string | null>(null);
  const [q3WrongFeedback, setQ3WrongFeedback] = useState<{
    cardId: string;
    target: 'BUP-BE' | 'TET-THIEU-NHI';
  } | null>(null);

  // --- CÂU 4 STATE ---
  const [q4FavoriteId, setQ4FavoriteId] = useState<string | null>(null);
  const [q4Completed, setQ4Completed] = useState(false);
  const [q4NoteText, setQ4NoteText] = useState('');

  // --- CÂU 5 STATE ---
  const [q5SelectedHolidayId, setQ5SelectedHolidayId] = useState<string | null>(null);
  const [q5SelectedActivities, setQ5SelectedActivities] = useState<string[]>([]);
  const [q5CustomText, setQ5CustomText] = useState('');
  const [q5Completed, setQ5Completed] = useState(false);

  // --- SHARED VOICE RECORDER FOR CÂU 4 & CÂU 5 ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const [q4AudioUrl, setQ4AudioUrl] = useState<string | null>(null);
  const [q5AudioUrl, setQ5AudioUrl] = useState<string | null>(null);
  const [micMessage, setMicMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  const cleanupMic = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop error
      }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    setRecordingSec(0);
  };

  // Stop audio and mic when changing question
  useEffect(() => {
    audioManager.stopAll();
    cleanupMic();
    setMicMessage(null);
  }, [questionIndex]);

  // Full reset when requested
  useEffect(() => {
    if (resetTrigger > 0) {
      setQuestionIndex(0);
      setQ1SelectedId(null);
      setQ1ShowSakuraBurst(false);
      setQ2SelectedIds([]);
      setQ2Checked(false);
      setQ2IsAllCorrect(false);
      setQ3PlacedMap({});
      setQ3SelectedCardId(null);
      setQ3WrongFeedback(null);
      setQ4FavoriteId(null);
      setQ4Completed(false);
      setQ4NoteText('');
      setQ5SelectedHolidayId(null);
      setQ5SelectedActivities([]);
      setQ5CustomText('');
      setQ5Completed(false);
    }
  }, [resetTrigger]);

  useEffect(() => {
    return () => {
      audioManager.stopAll();
      cleanupMic();
    };
  }, []);

  const startOpenQuestionRecording = async (forQuestion: 4 | 5) => {
    audioManager.stopAll();
    setMicMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicMessage('Trình duyệt hiện tại chưa hỗ trợ ghi âm microphone.');
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
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          if (forQuestion === 4) {
            if (q4AudioUrl) URL.revokeObjectURL(q4AudioUrl);
            setQ4AudioUrl(url);
            setQ4Completed(true);
            audioManager.playCompleteSound();
          } else {
            if (q5AudioUrl) URL.revokeObjectURL(q5AudioUrl);
            setQ5AudioUrl(url);
            setQ5Completed(true);
            audioManager.playCompleteSound();
          }
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSec(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSec((prev) => {
          if (prev >= 30) {
            stopOpenQuestionRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setMicMessage(
        'Em hãy bấm Cho phép (Allow) Microphone để ghi âm câu trả lời nhé, hoặc em có thể chọn/viết câu trả lời bên dưới!'
      );
      cleanupMic();
    }
  };

  const stopOpenQuestionRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        cleanupMic();
      }
    } else {
      cleanupMic();
    }
  };

  const handleReadQuestionAloud = (qNum: number, text: string) => {
    audioManager.playAudioOrTTS({
      id: `quiz-q-${qNum}`,
      text,
      lang: 'vi',
    });
  };

  // --- CÂU 1 LOGIC ---
  const handleSelectQ1 = (choiceId: string, isCorrect: boolean) => {
    setQ1SelectedId(choiceId);
    if (isCorrect) {
      setQ1ShowSakuraBurst(true);
      audioManager.playCorrectSound();
    } else {
      setQ1ShowSakuraBurst(false);
      audioManager.playIncorrectSound();
    }
  };

  // --- CÂU 2 LOGIC ---
  const toggleQ2Activity = (id: string) => {
    if (q2Checked && q2IsAllCorrect) return;
    setQ2Checked(false);
    setQ2SelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCheckQ2 = () => {
    const correctIds = Q2_ACTIVITIES.filter((a) => a.isCorrect).map((a) => a.id);
    const isExactMatch =
      q2SelectedIds.length === correctIds.length &&
      correctIds.every((id) => q2SelectedIds.includes(id));

    setQ2Checked(true);
    setQ2IsAllCorrect(isExactMatch);
    if (isExactMatch) {
      audioManager.playCorrectSound();
    } else {
      audioManager.playIncorrectSound();
    }
  };

  const handleResetQ2 = () => {
    audioManager.stopSoundEffects();
    setQ2SelectedIds([]);
    setQ2Checked(false);
    setQ2IsAllCorrect(false);
  };

  // --- CÂU 3 LOGIC (Drag & Drop + Touch/Click support) ---
  const attemptPlaceQ3Card = (cardId: string, targetZone: 'BUP-BE' | 'TET-THIEU-NHI') => {
    const card = Q3_COMPARISON_CARDS.find((c) => c.id === cardId);
    if (!card || q3PlacedMap[cardId]) return;

    if (card.targetFestival === targetZone) {
      setQ3PlacedMap((prev) => ({
        ...prev,
        [cardId]: targetZone,
      }));
      setQ3SelectedCardId(null);
      setQ3DraggedCardId(null);
      setQ3WrongFeedback(null);
      audioManager.playCorrectSound();
    } else {
      setQ3WrongFeedback({ cardId, target: targetZone });
      setQ3SelectedCardId(null);
      setQ3DraggedCardId(null);
      audioManager.playIncorrectSound();
      window.setTimeout(() => {
        setQ3WrongFeedback((prev) => (prev?.cardId === cardId ? null : prev));
      }, 1600);
    }
  };

  const unplacedQ3Cards: Q3ComparisonCard[] = Q3_COMPARISON_CARDS.filter(
    (c) => !q3PlacedMap[c.id]
  );
  const placedBupBeCards: Q3ComparisonCard[] = Q3_COMPARISON_CARDS.filter(
    (c) => q3PlacedMap[c.id] === 'BUP-BE'
  );
  const placedTetThieuNhiCards: Q3ComparisonCard[] = Q3_COMPARISON_CARDS.filter(
    (c) => q3PlacedMap[c.id] === 'TET-THIEU-NHI'
  );
  const isQ3Complete = Object.keys(q3PlacedMap).length === Q3_COMPARISON_CARDS.length;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between py-3 px-3 sm:px-6 overflow-x-hidden relative">
      {/* Background: Phong cảnh mùa xuân dưới chân núi Phú Sĩ */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${fujiBgImage})` }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-black/10 backdrop-blur-[0.5px]" aria-hidden="true" />

      {/* Top Navigation & Question Progress Bar */}
      <header className="w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 bg-white/95 backdrop-blur-md px-3 sm:px-5 py-2.5 rounded-3xl shadow-lg border-4 border-amber-300 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              audioManager.stopAll();
              cleanupMic();
              onNavigate('TRANG-BIA');
            }}
            className="inline-flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-3.5 py-2 rounded-2xl shadow-sm text-xs sm:text-sm cursor-pointer"
          >
            <span>🏠</span>
            <span>Trang chủ</span>
          </button>
          <button
            onClick={() => {
              audioManager.stopAll();
              cleanupMic();
              onNavigate('PHAN-2');
            }}
            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-3.5 py-2 rounded-2xl shadow-sm text-xs sm:text-sm cursor-pointer"
          >
            <span>←</span>
            <span>Thẻ từ vựng</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🧭</span>
          <h1 className="text-base sm:text-2xl font-black text-amber-900">
            THỬ TÀI NHÀ KHÁM PHÁ
          </h1>
        </div>

        {/* Question Step Pills: Câu 1/5 -> Câu 5/5 */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4].map((idx) => (
            <button
              key={idx}
              onClick={() => setQuestionIndex(idx)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer tabular-nums ${
                questionIndex === idx
                  ? 'bg-rose-600 text-white shadow-md scale-105'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
              }`}
            >
              Câu {idx + 1}/5
            </button>
          ))}
        </div>
      </header>

      {/* Main Quiz Stage */}
      <main className="w-full max-w-6xl mx-auto my-3 flex-1 flex flex-col justify-center z-10">
        {/* ==================================================
            CÂU 1 – CHỌN NHANH
           ================================================== */}
        {questionIndex === 0 && (
          <div className="bg-white rounded-[2rem] shadow-2xl border-4 border-pink-300 p-4 sm:p-7 relative overflow-hidden">
            {/* Falling Sakura Petals Celebration Effect when correct */}
            {q1ShowSakuraBurst && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden z-20 flex justify-around items-start pt-2">
                {['🌸', '💮', '🌸', '✨', '🌸', '💮', '🌸', '🌟'].map((petal, i) => (
                  <span
                    key={i}
                    className="text-2xl sm:text-4xl animate-bounce"
                    style={{ animationDelay: `${i * 120}ms` }}
                  >
                    {petal}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="bg-rose-100 text-rose-700 font-black px-4 py-1 rounded-full text-xs sm:text-sm">
                🌸 CÂU 1/5 – CHỌN NHANH
              </span>
              <button
                onClick={() =>
                  handleReadQuestionAloud(
                    1,
                    'Câu 1: Ở Nhật Bản, lễ hội nào được xem là lớn nhất, lâu đời nhất?'
                  )
                }
                className="inline-flex items-center gap-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold px-3.5 py-1.5 rounded-full text-xs sm:text-sm cursor-pointer"
              >
                <span>🔊</span>
                <span>{activeAudioId === 'quiz-q-1' ? 'Đang đọc câu hỏi...' : 'Nghe câu hỏi'}</span>
              </button>
            </div>

            <h2 className="text-xl sm:text-3xl font-black text-slate-900 mb-6 text-center leading-snug">
              “Ở Nhật Bản, lễ hội nào được xem là lớn nhất, lâu đời nhất?”
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {Q1_CHOICES.map((choice) => {
                const isSelected = q1SelectedId === choice.id;
                const isRight = isSelected && choice.isCorrect;
                const isWrong = isSelected && !choice.isCorrect;

                return (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleSelectQ1(choice.id, choice.isCorrect)}
                    className={`group relative rounded-3xl p-3.5 sm:p-4 border-4 text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isRight
                        ? 'border-emerald-500 bg-emerald-50 shadow-xl scale-[1.02]'
                        : isWrong
                        ? 'border-red-500 bg-red-50 shadow-md'
                        : 'border-pink-200 bg-white hover:border-pink-400 hover:shadow-lg'
                    }`}
                  >
                    <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden mb-3 border-2 border-white shadow">
                      <img
                        src={choice.image}
                        alt={choice.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isRight && (
                        <div className="absolute top-2 right-2 w-10 h-10 rounded-full bg-emerald-500 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                          ✓
                        </div>
                      )}
                      {isWrong && (
                        <div className="absolute top-2 right-2 w-10 h-10 rounded-full bg-red-500 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                          ✕
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-black text-slate-900">
                        {choice.title}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 font-semibold mt-0.5">
                        {choice.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {q1SelectedId && (
              <div
                className={`mt-6 p-4 rounded-2xl border-2 text-center font-black text-base sm:text-xl ${
                  q1SelectedId === 'hoa-anh-dao'
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                    : 'bg-red-100 border-red-300 text-red-700'
                }`}
              >
                {q1SelectedId === 'hoa-anh-dao' ? (
                  <span>✓ Chính xác! 🌟 Lễ hội Hoa anh đào là lễ hội lớn và lâu đời nhất ở Nhật Bản!</span>
                ) : (
                  <span>✕ Em thử lại nhé! Hãy chọn một thẻ khác xem sao nào!</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================
            CÂU 2 – SĂN TÌM HOẠT ĐỘNG
           ================================================== */}
        {questionIndex === 1 && (
          <div className="bg-white rounded-[2rem] shadow-2xl border-4 border-sky-300 p-4 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="bg-sky-100 text-sky-800 font-black px-4 py-1 rounded-full text-xs sm:text-sm">
                🔍 CÂU 2/5 – SĂN TÌM HOẠT ĐỘNG (Chọn nhiều đáp án)
              </span>
              <button
                onClick={() =>
                  handleReadQuestionAloud(
                    2,
                    'Câu 2: Có những hoạt động gì trong lễ hội lớn nhất, lâu đời nhất đó?'
                  )
                }
                className="inline-flex items-center gap-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold px-3.5 py-1.5 rounded-full text-xs sm:text-sm cursor-pointer"
              >
                <span>🔊</span>
                <span>{activeAudioId === 'quiz-q-2' ? 'Đang đọc câu hỏi...' : 'Nghe câu hỏi'}</span>
              </button>
            </div>

            <h2 className="text-xl sm:text-3xl font-black text-slate-900 mb-2 text-center leading-snug">
              “Có những hoạt động gì trong lễ hội lớn nhất, lâu đời nhất đó?”
            </h2>
            <p className="text-center text-xs sm:text-sm font-bold text-slate-600 mb-5">
              Em hãy bấm chọn TẤT CẢ các hoạt động đúng trong Lễ hội Hoa anh đào rồi bấm nút “Kiểm tra” nhé!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
              {Q2_ACTIVITIES.map((act) => {
                const isSelected = q2SelectedIds.includes(act.id);
                const showRight = q2Checked && isSelected && act.isCorrect;
                const showWrong = q2Checked && isSelected && !act.isCorrect;

                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => toggleQ2Activity(act.id)}
                    className={`flex items-center justify-between gap-3 p-4 rounded-2xl border-4 text-left transition-all cursor-pointer ${
                      showRight
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : showWrong
                        ? 'border-red-500 bg-red-50 text-red-900'
                        : isSelected
                        ? 'border-sky-500 bg-sky-50 text-sky-950 shadow-md'
                        : 'border-slate-200 bg-slate-50 hover:border-sky-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl shrink-0">{act.emoji}</span>
                      <span className="font-extrabold text-sm sm:text-lg leading-snug">
                        {act.text}
                      </span>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-lg shrink-0 border-2 ${
                        showRight
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : showWrong
                          ? 'bg-red-500 border-red-500 text-white'
                          : isSelected
                          ? 'bg-sky-500 border-sky-500 text-white'
                          : 'bg-white border-slate-300 text-transparent'
                      }`}
                    >
                      {showWrong ? '✕' : '✓'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleCheckQ2}
                disabled={q2SelectedIds.length === 0}
                className={`py-3 px-8 rounded-2xl font-black text-base sm:text-lg shadow-lg transition-all ${
                  q2SelectedIds.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer active:scale-95'
                }`}
              >
                ✅ Kiểm tra ({q2SelectedIds.length} lựa chọn)
              </button>

              {q2Checked && !q2IsAllCorrect && (
                <button
                  type="button"
                  onClick={handleResetQ2}
                  className="py-3 px-6 rounded-2xl font-black text-base sm:text-lg bg-rose-500 hover:bg-rose-600 text-white shadow-lg cursor-pointer"
                >
                  🔄 Làm lại
                </button>
              )}
            </div>

            {q2Checked && (
              <div
                className={`mt-5 p-4 rounded-2xl border-2 text-center font-black text-sm sm:text-lg ${
                  q2IsAllCorrect
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                    : 'bg-red-100 border-red-300 text-red-700'
                }`}
              >
                {q2IsAllCorrect ? (
                  <span>
                    ✓ Chính xác! 🌟 Trong Lễ hội Hoa anh đào, mọi người ngồi dưới gốc anh đào ngắm
                    hoa, cùng liên hoan, cùng hát hò và nhảy múa!
                  </span>
                ) : (
                  <span>
                    ✕ Chưa thật chính xác hoặc còn thiếu hoạt động đúng (có tất cả 4 hoạt động đúng
                    trong bài đọc). Em hãy kiểm tra lại nhé!
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================
            CÂU 3 – NHÀ SO SÁNH (KÉO – THẢ)
           ================================================== */}
        {questionIndex === 2 && (
          <div className="bg-white rounded-[2rem] shadow-2xl border-4 border-amber-300 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="bg-amber-100 text-amber-900 font-black px-4 py-1 rounded-full text-xs sm:text-sm">
                ⚖️ CÂU 3/5 – NHÀ SO SÁNH (Kéo – Thả thông tin)
              </span>
              <button
                onClick={() =>
                  handleReadQuestionAloud(
                    3,
                    'Câu 3: Lễ hội Búp bê và Tết Thiếu nhi ở Nhật Bản có những điểm gì khác nhau?'
                  )
                }
                className="inline-flex items-center gap-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold px-3.5 py-1.5 rounded-full text-xs sm:text-sm cursor-pointer"
              >
                <span>🔊</span>
                <span>{activeAudioId === 'quiz-q-3' ? 'Đang đọc câu hỏi...' : 'Nghe câu hỏi'}</span>
              </button>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 mb-2 text-center leading-snug">
              “Lễ hội Búp bê và Tết Thiếu nhi ở Nhật Bản có những điểm gì khác nhau?”
            </h2>

            {/* 4 Textbook Hints */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4 text-xs font-bold text-slate-600">
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg">1. Lễ hội dành cho ai?</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                2. Tổ chức vào thời gian nào?
              </span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg">3. Lễ hội có ý nghĩa gì?</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                4. Có hoạt động nào trong lễ hội?
              </span>
            </div>

            {/* Wrong Drop Brief Alert */}
            {q3WrongFeedback && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-100 border-2 border-red-400 text-red-700 font-black text-center text-xs sm:text-sm animate-bounce">
                ✕ Chưa đúng lễ hội rồi! Thẻ đã quay về vị trí ban đầu, em thử lại nhé!
              </div>
            )}

            {/* Unplaced Cards Bank */}
            {!isQ3Complete ? (
              <div className="bg-amber-50/90 border-2 border-dashed border-amber-400 rounded-2xl p-3 mb-4">
                <div className="text-xs sm:text-sm font-extrabold text-amber-900 mb-2 flex items-center justify-between">
                  <span>
                    📦 Kéo thẻ bên dưới thả vào đúng lễ hội (hoặc chạm chọn thẻ rồi chạm vào khung lễ
                    hội):
                  </span>
                  <span className="tabular-nums">
                    Còn {unplacedQ3Cards.length}/{Q3_COMPARISON_CARDS.length} thẻ
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {unplacedQ3Cards.map((card) => {
                    const isSelected = q3SelectedCardId === card.id;
                    const isWrongCard = q3WrongFeedback?.cardId === card.id;
                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => {
                          setQ3DraggedCardId(card.id);
                          setQ3SelectedCardId(card.id);
                          e.dataTransfer.setData('text/plain', card.id);
                        }}
                        onDragEnd={() => setQ3DraggedCardId(null)}
                        onClick={() =>
                          setQ3SelectedCardId((prev) => (prev === card.id ? null : card.id))
                        }
                        className={`px-3 py-2 rounded-xl border-2 font-bold text-xs sm:text-sm transition-all cursor-grab active:cursor-grabbing select-none ${
                          isWrongCard
                            ? 'bg-red-100 border-red-500 text-red-800'
                            : isSelected
                            ? 'bg-amber-500 border-amber-700 text-white shadow-md scale-[1.02]'
                            : 'bg-white border-amber-300 hover:border-amber-500 text-slate-800 shadow-xs'
                        }`}
                      >
                        <span className="text-[11px] font-black uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mr-1.5">
                          {card.categoryHint}
                        </span>
                        <span>{card.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-100 border-2 border-emerald-400 text-emerald-800 font-black text-center text-sm sm:text-lg">
                ✓ Xuất sắc! 🌟 Em đã phân loại chính xác tất cả các điểm khác nhau giữa Lễ hội Búp
                bê và Tết Thiếu nhi!
              </div>
            )}

            {/* Two Drop Zones: 🎎 LỄ HỘI BÚP BÊ & 🎏 TẾT THIẾU NHI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Zone 1: Lễ hội Búp bê */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('text/plain') || q3DraggedCardId;
                  if (id) attemptPlaceQ3Card(id, 'BUP-BE');
                }}
                onClick={() => {
                  if (q3SelectedCardId) {
                    attemptPlaceQ3Card(q3SelectedCardId, 'BUP-BE');
                  }
                }}
                className={`rounded-3xl border-4 p-3.5 sm:p-4 min-h-[220px] transition-all flex flex-col ${
                  q3SelectedCardId
                    ? 'border-pink-500 bg-pink-50/90 ring-4 ring-pink-200 cursor-pointer'
                    : 'border-pink-300 bg-pink-50/50'
                }`}
              >
                <div className="flex items-center justify-between bg-pink-500 text-white px-4 py-2 rounded-2xl font-black text-sm sm:text-lg mb-3 shadow-xs">
                  <span>🎎 LỄ HỘI BÚP BÊ</span>
                  <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full tabular-nums">
                    {placedBupBeCards.length}/6
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  {placedBupBeCards.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-xs sm:text-sm font-bold text-pink-400 border-2 border-dashed border-pink-200 rounded-2xl p-4 text-center">
                      Kéo hoặc chạm để thả thông tin của Lễ hội Búp bê vào đây
                    </div>
                  )}
                  {placedBupBeCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-white border-2 border-emerald-500 rounded-xl p-2.5 flex items-start justify-between gap-2 shadow-xs"
                    >
                      <div className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                        <span className="text-[11px] font-black text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded mr-1.5">
                          {card.categoryHint}
                        </span>
                        {card.text}
                      </div>
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                        ✓
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zone 2: Tết Thiếu nhi */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('text/plain') || q3DraggedCardId;
                  if (id) attemptPlaceQ3Card(id, 'TET-THIEU-NHI');
                }}
                onClick={() => {
                  if (q3SelectedCardId) {
                    attemptPlaceQ3Card(q3SelectedCardId, 'TET-THIEU-NHI');
                  }
                }}
                className={`rounded-3xl border-4 p-3.5 sm:p-4 min-h-[220px] transition-all flex flex-col ${
                  q3SelectedCardId
                    ? 'border-sky-500 bg-sky-50/90 ring-4 ring-sky-200 cursor-pointer'
                    : 'border-sky-300 bg-sky-50/50'
                }`}
              >
                <div className="flex items-center justify-between bg-sky-600 text-white px-4 py-2 rounded-2xl font-black text-sm sm:text-lg mb-3 shadow-xs">
                  <span>🎏 TẾT THIẾU NHI</span>
                  <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full tabular-nums">
                    {placedTetThieuNhiCards.length}/4
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  {placedTetThieuNhiCards.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-xs sm:text-sm font-bold text-sky-400 border-2 border-dashed border-sky-200 rounded-2xl p-4 text-center">
                      Kéo hoặc chạm để thả thông tin của Tết Thiếu nhi vào đây
                    </div>
                  )}
                  {placedTetThieuNhiCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-white border-2 border-emerald-500 rounded-xl p-2.5 flex items-start justify-between gap-2 shadow-xs"
                    >
                      <div className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                        <span className="text-[11px] font-black text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded mr-1.5">
                          {card.categoryHint}
                        </span>
                        {card.text}
                      </div>
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                        ✓
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            CÂU 4 – LỄ HỘI EM YÊU THÍCH (CÂU HỎI MỞ)
           ================================================== */}
        {questionIndex === 3 && (
          <div className="bg-white rounded-[2rem] shadow-2xl border-4 border-pink-300 p-4 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="bg-pink-100 text-rose-700 font-black px-4 py-1 rounded-full text-xs sm:text-sm">
                💖 CÂU 4/5 – LỄ HỘI EM YÊU THÍCH (Chia sẻ cảm nghĩ)
              </span>
              <button
                onClick={() =>
                  handleReadQuestionAloud(
                    4,
                    'Câu 4: Trong những lễ hội được nói đến ở bài đọc, em thích lễ hội nào nhất? Vì sao?'
                  )
                }
                className="inline-flex items-center gap-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold px-3.5 py-1.5 rounded-full text-xs sm:text-sm cursor-pointer"
              >
                <span>🔊</span>
                <span>{activeAudioId === 'quiz-q-4' ? 'Đang đọc câu hỏi...' : 'Nghe câu hỏi'}</span>
              </button>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-5 text-center leading-snug">
              “Trong những lễ hội được nói đến ở bài đọc, em thích lễ hội nào nhất? Vì sao?”
            </h2>

            {/* 3 Festival Cards to Choose Favorite */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {Q1_CHOICES.map((fest) => {
                const isSelected = q4FavoriteId === fest.id;
                return (
                  <button
                    key={fest.id}
                    type="button"
                    onClick={() => setQ4FavoriteId(fest.id)}
                    className={`rounded-3xl p-3 border-4 text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50 shadow-lg scale-[1.02]'
                        : 'border-slate-200 bg-white hover:border-pink-300'
                    }`}
                  >
                    <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden mb-2 border border-pink-100">
                      <img
                        src={fest.image}
                        alt={fest.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="font-black text-base sm:text-lg text-slate-900">
                      {isSelected ? '❤️ ' : ''}
                      {fest.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Speaking & Sharing Box once a festival is chosen */}
            {q4FavoriteId && (
              <div className="bg-rose-50/80 border-2 border-rose-200 rounded-3xl p-4 sm:p-5 text-center animate-in fade-in duration-200">
                <div className="text-base sm:text-xl font-black text-rose-700 mb-3">
                  🎙️ “Hãy nói vì sao em thích lễ hội này.”
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() =>
                      isRecording
                        ? stopOpenQuestionRecording()
                        : startOpenQuestionRecording(4)
                    }
                    className={`inline-flex items-center gap-2 py-3 px-6 rounded-2xl font-black text-sm sm:text-base shadow-md cursor-pointer ${
                      isRecording
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-rose-500 hover:bg-rose-600 text-white'
                    }`}
                  >
                    <span>{isRecording ? '⏹️' : '🎙️'}</span>
                    <span>
                      {isRecording ? `Dừng ghi âm (${recordingSec}s)` : 'Bắt đầu ghi âm'}
                    </span>
                  </button>

                  {q4AudioUrl && !isRecording && (
                    <button
                      type="button"
                      onClick={() => audioManager.playRecordedBlob('q4-playback', q4AudioUrl)}
                      className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl font-black text-sm sm:text-base bg-emerald-500 hover:bg-emerald-600 text-white shadow-md cursor-pointer"
                    >
                      <span>▶️</span>
                      <span>
                        {activeAudioId === 'q4-playback' ? 'Đang phát...' : 'Nghe lại'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Optional Text Input for students who also want to type */}
                <div className="max-w-xl mx-auto mt-2">
                  <input
                    type="text"
                    value={q4NoteText}
                    onChange={(e) => setQ4NoteText(e.target.value)}
                    placeholder="Hoặc em có thể gõ lý do em yêu thích lễ hội này vào đây..."
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-pink-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:border-rose-400"
                  />
                </div>

                {!q4Completed && (q4NoteText.trim().length > 0 || q4FavoriteId) && (
                  <button
                    type="button"
                    onClick={() => {
                      setQ4Completed(true);
                      audioManager.playCompleteSound();
                    }}
                    className="mt-3 py-2.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow cursor-pointer"
                  >
                    ✅ Hoàn thành chia sẻ
                  </button>
                )}

                {micMessage && (
                  <p className="mt-2 text-xs font-bold text-amber-800">{micMessage}</p>
                )}

                {q4Completed && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-white border-2 border-rose-300 text-rose-600 font-black text-base sm:text-xl shadow-xs">
                    “Cảm ơn em đã chia sẻ! ❤️”
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================
            CÂU 5 – KẾT NỐI VIỆT NAM (CÂU HỎI MỞ)
           ================================================== */}
        {questionIndex === 4 && (
          <div className="bg-white rounded-[2rem] shadow-2xl border-4 border-red-300 p-4 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="bg-red-100 text-red-700 font-black px-4 py-1 rounded-full text-xs sm:text-sm">
                🇻🇳 CÂU 5/5 – KẾT NỐI VIỆT NAM
              </span>
              <button
                onClick={() =>
                  handleReadQuestionAloud(
                    5,
                    'Câu 5: Ở Việt Nam có những ngày lễ, ngày tết nào dành cho trẻ em? Hãy kể lại một số hoạt động được trẻ em yêu thích trong những ngày lễ, ngày tết đó.'
                  )
                }
                className="inline-flex items-center gap-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold px-3.5 py-1.5 rounded-full text-xs sm:text-sm cursor-pointer"
              >
                <span>🔊</span>
                <span>{activeAudioId === 'quiz-q-5' ? 'Đang đọc câu hỏi...' : 'Nghe câu hỏi'}</span>
              </button>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 mb-4 text-center leading-snug">
              “Ở Việt Nam có những ngày lễ, ngày tết nào dành cho trẻ em? Hãy kể lại một số hoạt
              động được trẻ em yêu thích trong những ngày lễ, ngày tết đó.”
            </h2>

            {/* Step 1: Choose Vietnamese Children's Holiday */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {Q5_VIETNAM_HOLIDAYS.map((holiday) => {
                const isSelected = q5SelectedHolidayId === holiday.id;
                return (
                  <button
                    key={holiday.id}
                    type="button"
                    onClick={() => setQ5SelectedHolidayId(holiday.id)}
                    className={`p-4 rounded-3xl border-4 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-red-500 bg-amber-50 shadow-lg'
                        : 'border-slate-200 bg-slate-50 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-3xl">{holiday.emoji}</span>
                      <span className="font-black text-base sm:text-xl text-rose-700">
                        {holiday.name}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium">
                      {holiday.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Step 2: Select favorite activities or record voice narration */}
            {q5SelectedHolidayId && (
              <div className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 animate-in fade-in duration-200">
                <div className="font-black text-sm sm:text-base text-amber-950 mb-2.5">
                  🌟 Chọn các hoạt động trẻ em yêu thích hoặc bấm Ghi âm để kể lại nhé:
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {Q5_VIETNAM_HOLIDAYS.find(
                    (h) => h.id === q5SelectedHolidayId
                  )?.suggestedActivities.map((act) => {
                    const active = q5SelectedActivities.includes(act);
                    return (
                      <button
                        key={act}
                        type="button"
                        onClick={() => {
                          const isAdding = !q5SelectedActivities.includes(act);
                          setQ5SelectedActivities((prev) =>
                            prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
                          );
                          setQ5Completed(true);
                          if (isAdding) {
                            audioManager.playCompleteSound();
                          }
                        }}
                        className={`px-3.5 py-2 rounded-2xl font-bold text-xs sm:text-sm border-2 transition-all cursor-pointer ${
                          active
                            ? 'bg-rose-500 border-rose-600 text-white shadow-sm'
                            : 'bg-white border-amber-300 text-slate-800 hover:border-rose-400'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {act}
                      </button>
                    );
                  })}
                </div>

                {/* Microphone Recording + Optional Text Box */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-amber-200">
                  <button
                    type="button"
                    onClick={() =>
                      isRecording
                        ? stopOpenQuestionRecording()
                        : startOpenQuestionRecording(5)
                    }
                    className={`inline-flex items-center gap-2 py-2.5 px-5 rounded-2xl font-black text-xs sm:text-sm shadow cursor-pointer ${
                      isRecording
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-rose-500 hover:bg-rose-600 text-white'
                    }`}
                  >
                    <span>{isRecording ? '⏹️' : '🎙️'}</span>
                    <span>
                      {isRecording
                        ? `Dừng ghi âm (${recordingSec}s)`
                        : 'Ghi âm lời kể của em'}
                    </span>
                  </button>

                  {q5AudioUrl && !isRecording && (
                    <button
                      type="button"
                      onClick={() => audioManager.playRecordedBlob('q5-playback', q5AudioUrl)}
                      className="inline-flex items-center gap-2 py-2.5 px-5 rounded-2xl font-black text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow cursor-pointer"
                    >
                      <span>▶️</span>
                      <span>
                        {activeAudioId === 'q5-playback' ? 'Đang phát...' : 'Nghe lại lời kể'}
                      </span>
                    </button>
                  )}

                  <input
                    type="text"
                    value={q5CustomText}
                    onChange={(e) => {
                      setQ5CustomText(e.target.value);
                      if (e.target.value.trim()) setQ5Completed(true);
                    }}
                    placeholder="Hoặc viết thêm hoạt động em thích..."
                    className="flex-1 min-w-[220px] px-3.5 py-2 rounded-xl border-2 border-amber-200 bg-white text-xs sm:text-sm font-semibold"
                  />
                </div>

                {q5Completed && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-emerald-100 border-2 border-emerald-400 text-emerald-900 font-black text-center text-sm sm:text-lg">
                    “Tuyệt vời! Em biết kết nối bài học với cuộc sống rồi! 🇻🇳”
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom Prev / Next Question Navigation */}
        <div className="flex items-center justify-between gap-4 mt-4">
          <button
            type="button"
            onClick={() => {
              if (questionIndex > 0) setQuestionIndex(questionIndex - 1);
            }}
            disabled={questionIndex === 0}
            className={`py-3 px-5 sm:px-7 rounded-2xl font-black text-sm sm:text-lg shadow-md transition-all ${
              questionIndex === 0
                ? 'bg-white/50 text-slate-400 cursor-not-allowed'
                : 'bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-300 cursor-pointer'
            }`}
          >
            ← Câu trước
          </button>

          <div className="text-xs sm:text-sm font-extrabold text-slate-700 tabular-nums">
            Tiến trình: <span className="text-rose-600">Câu {questionIndex + 1}/5</span>
          </div>

          {questionIndex < 4 ? (
            <button
              type="button"
              onClick={() => setQuestionIndex(questionIndex + 1)}
              className="py-3 px-5 sm:px-7 rounded-2xl font-black text-sm sm:text-lg bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-all cursor-pointer active:scale-95"
            >
              Câu tiếp theo →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                audioManager.stopAll();
                cleanupMic();
                onNavigate('HOAN-THANH');
              }}
              className="py-3 px-6 sm:px-8 rounded-2xl font-black text-sm sm:text-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-all cursor-pointer active:scale-95"
            >
              🎉 Hoàn thành thử thách →
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

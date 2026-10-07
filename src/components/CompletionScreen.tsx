import React, { useEffect } from 'react';
import { ScreenId } from '../data/appData';
import { audioManager } from '../services/audioManager';

interface CompletionScreenProps {
  onNavigate: (target: ScreenId) => void;
  onRetryQuiz: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  onNavigate,
  onRetryQuiz,
}) => {
  useEffect(() => {
    audioManager.playAudioOrTTS({
      id: 'completion-congrats',
      text: 'Tuyệt vời! Em đã hoàn thành hành trình khám phá Lễ hội ở Nhật Bản!',
      lang: 'vi',
    });
    return () => {
      audioManager.stopAll();
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-pink-100 via-amber-50 to-sky-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gentle Celebration Decorative Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden flex justify-around items-start pt-6 opacity-80 select-none">
        {['🌸', '⭐', '🎎', '⭐', '🎏', '🌸', '⭐', '🎎'].map((icon, idx) => (
          <span
            key={idx}
            className="text-3xl sm:text-5xl animate-bounce"
            style={{ animationDuration: `${2.2 + (idx % 3) * 0.4}s` }}
          >
            {icon}
          </span>
        ))}
      </div>

      <div className="relative z-10 bg-white rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-10 shadow-2xl border-4 border-pink-300 text-center">
        {/* Decorative Icons Row */}
        <div className="flex items-center justify-center gap-4 text-4xl sm:text-6xl mb-5">
          <span title="Hoa anh đào">🌸</span>
          <span title="Búp bê Hi-na">🎎</span>
          <span title="Cờ cá chép">🎏</span>
          <span title="Ngôi sao xuất sắc">⭐</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-rose-600 leading-tight mb-2">
          Tuyệt vời!
        </h1>
        <p className="text-lg sm:text-2xl font-extrabold text-slate-800 leading-snug mb-3">
          Em đã hoàn thành hành trình khám phá
        </p>
        <div className="inline-block bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-2xl sm:text-4xl px-6 py-3 rounded-3xl shadow-lg mb-8">
          LỄ HỘI Ở NHẬT BẢN!
        </div>

        {/* 3 Required Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            type="button"
            onClick={() => {
              audioManager.stopAll();
              onNavigate('TRANG-BIA');
            }}
            className="py-4 px-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-base sm:text-lg shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <span>🏠</span>
            <span>Trang chủ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioManager.stopAll();
              onRetryQuiz();
            }}
            className="py-4 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-base sm:text-lg shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span>Làm lại thử thách</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioManager.stopAll();
              onNavigate('PHAN-1');
            }}
            className="py-4 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-base sm:text-lg shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <span>🌸</span>
            <span>Khám phá lại lễ hội</span>
          </button>
        </div>
      </div>
    </div>
  );
};

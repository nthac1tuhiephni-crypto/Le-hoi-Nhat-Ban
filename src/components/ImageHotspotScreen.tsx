import React, { useEffect, useState } from 'react';
import {
  AudioSlotKey,
  FESTIVAL_TEXTS,
  HotspotConfig,
  ImageScreenKey,
  SCREEN_HOTSPOTS,
  ScreenId,
  VOCABULARY_CARDS,
} from '../data/appData';
import { audioManager } from '../services/audioManager';

interface ImageHotspotScreenProps {
  screenKey: ImageScreenKey;
  customImages: Record<string, string | null>;
  customAudios: Record<string, string | null>;
  activeAudioId: string | null;
  isAudioLoading: boolean;
  onNavigate: (target: ScreenId) => void;
  onOpenAssetModal: () => void;
  onQuickUploadFiles: (files: FileList) => Promise<void>;
}

export const ImageHotspotScreen: React.FC<ImageHotspotScreenProps> = ({
  screenKey,
  customImages,
  customAudios,
  activeAudioId,
  isAudioLoading,
  onNavigate,
  onOpenAssetModal,
  onQuickUploadFiles,
}) => {
  const [imageLoadFailed, setImageLoadFailed] = useState<Record<string, boolean>>({});
  const [showFinishExploreModal, setShowFinishExploreModal] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Stop any audio when leaving screen or unmounting
  useEffect(() => {
    return () => {
      audioManager.stopAll();
    };
  }, [screenKey]);

  const hotspots = SCREEN_HOTSPOTS[screenKey];
  const uploadedUrl = customImages[screenKey];
  const hasValidUploadedImage = Boolean(uploadedUrl && !imageLoadFailed[uploadedUrl]);

  const handleHotspotClick = (spot: HotspotConfig) => {
    if (spot.actionType === 'navigate' && spot.targetScreen) {
      audioManager.stopAll();
      onNavigate(spot.targetScreen);
      return;
    }

    if (spot.actionType === 'finish-explore') {
      audioManager.stopAll();
      setShowFinishExploreModal(true);
      return;
    }

    if (spot.actionType === 'audio') {
      // Bấm lại thẻ đang phát thì dừng
      if (activeAudioId === spot.id) {
        audioManager.stopAll();
        return;
      }

      // Dừng audio hiện tại và phát audio mới từ đầu
      const customAudioUrl = spot.audioUrl || (spot.audioSlot ? customAudios[spot.audioSlot] : null);
      audioManager.playAudioOrTTS({
        id: spot.id,
        customAudioUrl,
        text: spot.audioText || spot.label,
        lang: spot.audioLang || 'vi',
      });
      return;
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await onQuickUploadFiles(e.dataTransfer.files);
    }
  };

  const missingImagesCount = [
    'TRANG-BIA',
    'PHAN-1',
    'HOA-ANH-DAO',
    'BUP-BE',
    'TET-THIEU-NHI',
    'LE-HOI-KHAC',
  ].filter((k) => !customImages[k]).length;

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-b from-sky-100 via-rose-50 to-amber-50 flex flex-col items-center justify-center p-2 sm:p-4 relative"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      {/* Top Helper Bar outside the 16:9 image frame so it NEVER overlaps the image */}
      <div className="w-full max-w-[1440px] flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-rose-800">
          <span>🌸 Bài 29: Lễ hội ở Nhật Bản</span>
          {activeAudioId && (
            <button
              onClick={() => audioManager.stopAll()}
              className="inline-flex items-center gap-1.5 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm hover:bg-rose-700 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              {isAudioLoading ? 'Đang tải âm thanh...' : 'Đang đọc... (Bấm để dừng)'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {missingImagesCount > 0 && (
            <label className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer">
              <span>📁 Chọn 6 ảnh gốc ({6 - missingImagesCount}/6)</span>
              <input
                type="file"
                multiple
                accept="image/*,audio/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onQuickUploadFiles(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          )}
          <button
            onClick={onOpenAssetModal}
            className="inline-flex items-center gap-1.5 bg-white/90 hover:bg-white text-slate-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            title="Tải lên hoặc cập nhật 6 ảnh gốc và file Audio"
          >
            <span>⚙️ Quản lý Ảnh & Audio</span>
          </button>
        </div>
      </div>

      {/* Strict 16:9 Container - Hotspots always stay locked to exact relative % coordinates on any device */}
      <div
        className={`relative w-full max-w-[1440px] aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-4 ${
          isDraggingOver ? 'border-amber-400 ring-4 ring-amber-300' : 'border-white/90'
        } bg-sky-200 select-none`}
      >
        {hasValidUploadedImage && uploadedUrl ? (
          <img
            src={uploadedUrl}
            alt={screenKey}
            referrerPolicy="no-referrer"
            onError={() =>
              setImageLoadFailed((prev) => ({
                ...prev,
                [uploadedUrl]: true,
              }))
            }
            className="w-full h-full object-fill block pointer-events-none select-none"
          />
        ) : (
          /* High-fidelity 16:9 scene matching the exact hotspot coordinates while waiting for raw PNG upload */
          <Fallback16x9Scene screenKey={screenKey} />
        )}

        {/* Transparent Interactive Hotspots */}
        {hotspots.map((spot) => {
          const isThisAudioPlaying = activeAudioId === spot.id;
          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => handleHotspotClick(spot)}
              aria-label={spot.label}
              title={spot.label}
              style={{
                left: `${spot.left}%`,
                top: `${spot.top}%`,
                width: `${spot.width}%`,
                height: `${spot.height}%`,
              }}
              className={`absolute z-20 bg-transparent rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 ${
                isThisAudioPlaying
                  ? 'ring-4 ring-yellow-400/90 bg-yellow-300/10 shadow-[0_0_20px_rgba(250,204,21,0.35)] animate-pulse'
                  : 'hover:bg-white/10 active:bg-white/20'
              }`}
            />
          );
        })}
      </div>

      {/* Modal when clicking "Kết thúc khám phá" on LE-HOI-KHAC */}
      {showFinishExploreModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-pink-300 text-center relative animate-in fade-in zoom-in-95 duration-200">
            <div className="text-5xl mb-3">🌸🎎🎏</div>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-600 mb-3">
              Hoàn thành khám phá!
            </h3>
            <p className="text-base sm:text-lg font-bold text-slate-700 leading-relaxed mb-6">
              “Tuyệt vời! Em đã hoàn thành hành trình khám phá các lễ hội ở Nhật Bản!”
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setShowFinishExploreModal(false);
                  onNavigate('PHAN-1');
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-base shadow-md transition-colors cursor-pointer"
              >
                🗺️ Quay lại bản đồ
              </button>
              <button
                onClick={() => {
                  setShowFinishExploreModal(false);
                  onNavigate('PHAN-2');
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-base shadow-md transition-colors cursor-pointer"
              >
                🃏 Sang Thẻ từ vựng
              </button>
            </div>
            <button
              onClick={() => {
                setShowFinishExploreModal(false);
                onNavigate('TRANG-BIA');
              }}
              className="mt-3 w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm transition-colors cursor-pointer"
            >
              🏠 Về Trang chủ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Pixel-aligned 16:9 visual canvas that places every button and text block at the exact same
 * percentage coordinates as the 6 uploaded PNG designs when the raw PNG files haven't been
 * dropped into /public/images/ yet.
 */
const Fallback16x9Scene: React.FC<{ screenKey: ImageScreenKey }> = ({ screenKey }) => {
  if (screenKey === 'TRANG-BIA') {
    return (
      <div className="relative w-full h-full overflow-hidden select-none pointer-events-none">
        <img
          src={VOCABULARY_CARDS[5].image}
          alt="Background Japan"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover brightness-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400/20 via-transparent to-amber-900/40" />

        {/* Wooden Header Board */}
        <div
          style={{ left: '26%', top: '3%', width: '48%', height: '39%' }}
          className="absolute bg-gradient-to-b from-amber-100 to-amber-200 rounded-3xl border-[5px] border-amber-700 shadow-xl flex flex-col items-center justify-center p-2 text-center"
        >
          <div className="bg-amber-800 text-amber-50 font-black px-4 py-0.5 rounded-full text-[clamp(10px,1.5vw,20px)] mb-1 shadow">
            🌸 Bài 29 🌸
          </div>
          <div className="text-rose-600 font-black tracking-tight leading-none text-[clamp(18px,3.8vw,54px)] drop-shadow-sm">
            LỄ HỘI Ở
          </div>
          <div className="text-blue-600 font-black tracking-tight leading-none text-[clamp(18px,4vw,56px)] mt-1 drop-shadow-sm">
            NHẬT BẢN
          </div>
        </div>

        {/* 3 Bottom Selection Cards at exact hotspot coordinates */}
        <div
          style={{ left: '4%', top: '64%', width: '30%', height: '31.8%' }}
          className="absolute bg-gradient-to-b from-pink-100 to-white rounded-3xl border-4 border-pink-400 shadow-xl flex flex-col justify-between p-2 sm:p-3 overflow-hidden"
        >
          <div className="h-[52%] w-full rounded-xl overflow-hidden relative">
            <img
              src={VOCABULARY_CARDS[1].image}
              alt="Du hành lễ hội"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-2 bg-amber-50/90 rounded-2xl p-1.5 sm:p-2 border border-pink-200">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm sm:text-xl shrink-0 shadow">
              🔍
            </div>
            <div className="text-center flex-1 leading-tight">
              <div className="text-rose-600 font-black text-[clamp(10px,1.5vw,22px)]">Du hành</div>
              <div className="text-blue-600 font-black text-[clamp(10px,1.5vw,22px)]">
                lễ hội Nhật Bản
              </div>
            </div>
          </div>
        </div>

        <div
          style={{ left: '35%', top: '63.5%', width: '30%', height: '32.3%' }}
          className="absolute bg-gradient-to-b from-lime-100 to-white rounded-3xl border-4 border-lime-500 shadow-xl flex flex-col justify-between p-2 sm:p-3 overflow-hidden"
        >
          <div className="h-[52%] w-full rounded-xl overflow-hidden relative">
            <img
              src={VOCABULARY_CARDS[3].image}
              alt="Thẻ từ vựng"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-2 bg-amber-50/90 rounded-2xl p-1.5 sm:p-2 border border-lime-300">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm sm:text-xl shrink-0 shadow">
              📖
            </div>
            <div className="text-center flex-1 leading-tight">
              <div className="text-rose-600 font-black text-[clamp(10px,1.5vw,22px)]">
                Thẻ từ vựng
              </div>
              <div className="text-blue-600 font-black text-[clamp(10px,1.5vw,22px)]">
                thông minh
              </div>
            </div>
          </div>
        </div>

        <div
          style={{ left: '66%', top: '64%', width: '30%', height: '31.8%' }}
          className="absolute bg-gradient-to-b from-amber-100 to-white rounded-3xl border-4 border-amber-400 shadow-xl flex flex-col justify-between p-2 sm:p-3 overflow-hidden"
        >
          <div className="h-[52%] w-full rounded-xl overflow-hidden relative">
            <img
              src={VOCABULARY_CARDS[0].image}
              alt="Thử tài nhà khám phá"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-2 bg-amber-50/90 rounded-2xl p-1.5 sm:p-2 border border-amber-300">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm sm:text-xl font-black shrink-0 shadow">
              ?
            </div>
            <div className="text-center flex-1 leading-tight">
              <div className="text-rose-600 font-black text-[clamp(10px,1.5vw,22px)]">Thử tài</div>
              <div className="text-blue-600 font-black text-[clamp(10px,1.5vw,22px)]">
                nhà khám phá
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screenKey === 'PHAN-1') {
    return (
      <div className="relative w-full h-full overflow-hidden select-none pointer-events-none">
        <img
          src={VOCABULARY_CARDS[5].image}
          alt="Map Background"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-200/30 via-transparent to-emerald-950/30" />

        {/* Top Left: Trang chủ */}
        <div
          style={{ left: '0.8%', top: '1.8%', width: '17.5%', height: '9.8%' }}
          className="absolute bg-white rounded-full border-4 border-pink-400 shadow-lg flex items-center px-2 gap-1.5"
        >
          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs sm:text-base shrink-0">
            🏠
          </span>
          <span className="text-rose-600 font-black text-[clamp(9px,1.3vw,18px)] truncate">
            Trang chủ
          </span>
        </div>

        {/* Center Header */}
        <div
          style={{ left: '32%', top: '2%', width: '36%', height: '27%' }}
          className="absolute bg-gradient-to-b from-amber-100 to-amber-200 rounded-3xl border-4 border-amber-700 shadow-xl flex flex-col items-center justify-center p-2 text-center"
        >
          <div className="text-rose-600 font-black text-[clamp(13px,2.3vw,34px)] leading-tight">
            ✈️ Du hành
          </div>
          <div className="text-blue-600 font-black text-[clamp(12px,2.1vw,30px)] leading-tight">
            lễ hội Nhật Bản
          </div>
          <div className="text-amber-900 font-bold text-[clamp(8px,0.95vw,13px)] mt-1">
            Cùng khám phá những lễ hội đặc sắc của đất nước Nhật Bản nhé!
          </div>
        </div>

        {/* Top Right: Sang thẻ từ vựng thông minh */}
        <div
          style={{ left: '77.6%', top: '1.8%', width: '21.8%', height: '12.2%' }}
          className="absolute bg-white rounded-full border-4 border-pink-400 shadow-lg flex items-center justify-between px-2 gap-1"
        >
          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs sm:text-base shrink-0">
            📖
          </span>
          <span className="text-rose-600 font-black text-[clamp(8px,1.05vw,14px)] leading-tight text-center">
            Sang thẻ từ vựng thông minh
          </span>
          <span className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shrink-0">
            ➜
          </span>
        </div>

        {/* Point 1: Lễ hội Hoa anh đào */}
        <div
          style={{ left: '5.5%', top: '33.5%', width: '27%', height: '41%' }}
          className="absolute flex flex-col items-center"
        >
          <div className="w-full bg-white/95 rounded-full border-4 border-pink-400 px-2 py-1 shadow-lg flex items-center gap-2 mb-1">
            <span className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-pink-500 text-white font-black flex items-center justify-center text-xs sm:text-lg shrink-0">
              1
            </span>
            <span className="text-rose-600 font-black text-[clamp(9px,1.25vw,18px)] leading-tight">
              Lễ hội Hoa anh đào
            </span>
          </div>
          <div className="flex-1 w-full rounded-2xl overflow-hidden border-4 border-white shadow-lg">
            <img
              src={VOCABULARY_CARDS[1].image}
              alt="Lễ hội Hoa anh đào"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Point 2: Lễ hội Búp bê */}
        <div
          style={{ left: '39.2%', top: '31%', width: '26%', height: '31%' }}
          className="absolute flex flex-col items-center"
        >
          <div className="w-full bg-white/95 rounded-full border-4 border-amber-400 px-2 py-1 shadow-lg flex items-center gap-2 mb-1">
            <span className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-orange-500 text-white font-black flex items-center justify-center text-xs sm:text-lg shrink-0">
              2
            </span>
            <span className="text-amber-800 font-black text-[clamp(9px,1.25vw,18px)] leading-tight">
              Lễ hội Búp bê
            </span>
          </div>
          <div className="flex-1 w-full rounded-2xl overflow-hidden border-4 border-white shadow-lg">
            <img
              src={VOCABULARY_CARDS[2].image}
              alt="Lễ hội Búp bê"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Point 3: Tết Thiếu nhi */}
        <div
          style={{ left: '69.2%', top: '30.5%', width: '29.8%', height: '41%' }}
          className="absolute flex flex-col items-center"
        >
          <div className="w-full bg-white/95 rounded-full border-4 border-sky-400 px-2 py-1 shadow-lg flex items-center gap-2 mb-1">
            <span className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-sky-500 text-white font-black flex items-center justify-center text-xs sm:text-lg shrink-0">
              3
            </span>
            <span className="text-blue-700 font-black text-[clamp(9px,1.25vw,18px)] leading-tight">
              Tết Thiếu nhi
            </span>
          </div>
          <div className="flex-1 w-full rounded-2xl overflow-hidden border-4 border-white shadow-lg">
            <img
              src={VOCABULARY_CARDS[4].image}
              alt="Tết Thiếu nhi"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Point 4: Những lễ hội thú vị khác */}
        <div
          style={{ left: '50.2%', top: '71.5%', width: '48.8%', height: '27%' }}
          className="absolute flex items-center gap-2 bg-white/90 rounded-3xl border-4 border-purple-400 p-2 shadow-xl"
        >
          <div className="flex items-center gap-2 w-1/2">
            <span className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-purple-500 text-white font-black flex items-center justify-center text-xs sm:text-lg shrink-0">
              4
            </span>
            <span className="text-purple-800 font-black text-[clamp(9px,1.25vw,18px)] leading-tight">
              Những lễ hội thú vị khác
            </span>
          </div>
          <div className="w-1/2 h-full rounded-2xl overflow-hidden border-2 border-purple-200">
            <img
              src={VOCABULARY_CARDS[0].image}
              alt="Những lễ hội thú vị khác"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    );
  }

  if (screenKey === 'LE-HOI-KHAC') {
    return (
      <div className="relative w-full h-full overflow-hidden select-none pointer-events-none">
        <img
          src={VOCABULARY_CARDS[0].image}
          alt="Một số lễ hội khác"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-300/50 via-transparent to-emerald-900/40" />

        {/* Top Left: Trang chủ */}
        <div
          style={{ left: '0.8%', top: '1.8%', width: '17.5%', height: '9.8%' }}
          className="absolute bg-white rounded-full border-4 border-pink-400 shadow-lg flex items-center px-2 gap-1.5"
        >
          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs sm:text-base shrink-0">
            🏠
          </span>
          <span className="text-rose-600 font-black text-[clamp(9px,1.3vw,18px)] truncate">
            Trang chủ
          </span>
        </div>

        {/* Top Center Sign */}
        <div
          style={{ left: '30%', top: '1.5%', width: '40%', height: '18%' }}
          className="absolute bg-amber-100 rounded-2xl border-4 border-amber-700 shadow-lg flex flex-col items-center justify-center text-center p-1"
        >
          <div className="text-rose-600 font-black text-[clamp(11px,1.9vw,28px)] leading-tight">
            Một số lễ hội khác
          </div>
          <div className="text-blue-700 font-black text-[clamp(11px,1.9vw,28px)] leading-tight">
            ở Nhật Bản
          </div>
        </div>

        {/* Top Right: Quay lại bản đồ */}
        <div
          style={{ left: '79.8%', top: '1.8%', width: '19.2%', height: '10.2%' }}
          className="absolute bg-white rounded-full border-4 border-sky-400 shadow-lg flex items-center justify-center px-2 gap-1.5"
        >
          <span className="text-sm sm:text-lg">🗺️</span>
          <span className="text-blue-700 font-black text-[clamp(9px,1.2vw,16px)] leading-tight text-center">
            Quay lại bản đồ
          </span>
        </div>

        {/* 3 Columns */}
        <div
          style={{ left: '3%', top: '21%', width: '94%', height: '66%' }}
          className="absolute grid grid-cols-3 gap-2 sm:gap-4"
        >
          <div className="bg-white/95 rounded-2xl border-4 border-pink-300 p-2 sm:p-3 flex flex-col justify-between shadow-lg">
            <div className="bg-pink-200 text-rose-700 font-black text-center py-1 px-2 rounded-xl text-[clamp(9px,1.2vw,18px)]">
              Lễ hội Ngôi sao (Tanabata)
            </div>
            <p className="text-slate-800 text-[clamp(8px,1vw,15px)] leading-snug font-medium">
              <strong>Lễ hội Ngôi sao (Tanabata)</strong> diễn ra vào ngày 07 tháng 7. Vào ngày này,
              người Nhật thường viết điều ước lên những mảnh giấy màu và treo lên cành tre, mong ước
              điều tốt đẹp sẽ thành hiện thực.
            </p>
          </div>

          <div className="bg-white/95 rounded-2xl border-4 border-amber-300 p-2 sm:p-3 flex flex-col justify-between shadow-lg">
            <div className="bg-amber-300 text-amber-900 font-black text-center py-1 px-2 rounded-xl text-[clamp(9px,1.2vw,18px)]">
              Lễ hội Obon
            </div>
            <p className="text-slate-800 text-[clamp(8px,1vw,15px)] leading-snug font-medium">
              <strong>Lễ hội Obon</strong> là dịp để người Nhật tưởng nhớ tổ tiên. Lễ hội thường
              diễn ra vào giữa tháng 8. Người dân thắp đèn lồng, múa điệu múa truyền thống và bày tỏ
              lòng biết ơn đối với những người đã khuất.
            </p>
          </div>

          <div className="bg-white/95 rounded-2xl border-4 border-sky-300 p-2 sm:p-3 flex flex-col justify-between shadow-lg">
            <div className="bg-sky-200 text-blue-800 font-black text-center py-1 px-2 rounded-xl text-[clamp(9px,1.2vw,18px)]">
              Lễ hội Tuyết Sapporo
            </div>
            <p className="text-slate-800 text-[clamp(8px,1vw,15px)] leading-snug font-medium">
              <strong>Lễ hội Tuyết Sapporo</strong> thường diễn ra vào tháng 2 hằng năm tại thành
              phố Sapporo. Trong lễ hội, người ta trưng bày nhiều tác phẩm điêu khắc bằng tuyết và
              băng với hình thù rất đẹp, ấn tượng.
            </p>
          </div>
        </div>

        {/* Bottom Left: Lễ hội trước */}
        <div
          style={{ left: '1.2%', top: '89%', width: '17.5%', height: '8.8%' }}
          className="absolute bg-white rounded-full border-4 border-pink-400 shadow-lg flex items-center px-2 gap-1.5"
        >
          <span className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shrink-0">
            ⬅
          </span>
          <span className="text-rose-600 font-black text-[clamp(9px,1.2vw,16px)] truncate">
            Lễ hội trước
          </span>
        </div>

        {/* Bottom Right: Kết thúc khám phá */}
        <div
          style={{ left: '76.2%', top: '89%', width: '22.5%', height: '8.8%' }}
          className="absolute bg-white rounded-full border-4 border-pink-400 shadow-lg flex items-center justify-between px-2.5 gap-1.5"
        >
          <span className="text-rose-600 font-black text-[clamp(9px,1.2vw,16px)] truncate">
            Kết thúc khám phá
          </span>
          <span className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shrink-0">
            ➜
          </span>
        </div>
      </div>
    );
  }

  // HOA-ANH-DAO, BUP-BE, TET-THIEU-NHI
  const info = FESTIVAL_TEXTS[screenKey];
  const bgImg =
    screenKey === 'HOA-ANH-DAO'
      ? VOCABULARY_CARDS[1].image
      : screenKey === 'BUP-BE'
      ? VOCABULARY_CARDS[2].image
      : VOCABULARY_CARDS[4].image;

  return (
    <div className="relative w-full h-full overflow-hidden select-none pointer-events-none">
      <img
        src={bgImg}
        alt={info.title}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />

      {/* Top Left: Trang chủ */}
      <div
        style={{ left: '0.8%', top: '1.8%', width: '17.5%', height: '9.8%' }}
        className="absolute bg-white rounded-full border-4 border-pink-400 shadow-lg flex items-center px-2 gap-1.5"
      >
        <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs sm:text-base shrink-0">
          🏠
        </span>
        <span className="text-rose-600 font-black text-[clamp(9px,1.3vw,18px)] truncate">
          Trang chủ
        </span>
      </div>

      {/* Top Center Banner */}
      <div
        style={{ left: '27%', top: '2%', width: '46%', height: '16%' }}
        className="absolute bg-amber-100 rounded-3xl border-4 border-amber-700 shadow-xl flex items-center justify-center px-3 text-center"
      >
        <span className="text-rose-600 font-black text-[clamp(14px,2.5vw,38px)]">{info.title}</span>
      </div>

      {/* Top Right: Quay lại bản đồ */}
      <div
        style={{ left: '81.8%', top: '1.8%', width: '17.5%', height: '9.8%' }}
        className="absolute bg-white rounded-full border-4 border-sky-400 shadow-lg flex items-center justify-center px-2 gap-1.5"
      >
        <span className="text-sm sm:text-lg">🗺️</span>
        <span className="text-blue-700 font-black text-[clamp(9px,1.2vw,16px)] leading-tight text-center">
          Quay lại bản đồ
        </span>
      </div>

      {/* Reading Passage Box */}
      <div
        style={{
          left: screenKey === 'HOA-ANH-DAO' ? '13.5%' : '58%',
          top: screenKey === 'HOA-ANH-DAO' ? '61%' : '24%',
          width: screenKey === 'HOA-ANH-DAO' ? '73%' : '39%',
          height: screenKey === 'HOA-ANH-DAO' ? '23.5%' : '58%',
        }}
        className="absolute bg-white/95 rounded-3xl border-4 border-pink-300 shadow-xl p-2.5 sm:p-5 flex items-center justify-center"
      >
        <p className="text-slate-900 font-medium text-[clamp(9px,1.25vw,19px)] leading-relaxed">
          {info.vi}
        </p>
      </div>

      {/* Bottom Left: Lễ hội trước */}
      <div
        style={{ left: '0.8%', top: '86.8%', width: '16%', height: '9%' }}
        className="absolute bg-white rounded-full border-4 border-pink-400 shadow-lg flex items-center px-2 gap-1.5"
      >
        <span className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shrink-0">
          ⬅
        </span>
        <span className="text-rose-600 font-black text-[clamp(8px,1.15vw,16px)] truncate">
          Lễ hội trước
        </span>
      </div>

      {/* Bottom Center-Left: Nghe tiếng Việt */}
      <div
        style={{ left: '28%', top: '86.8%', width: '22%', height: '10.4%' }}
        className="absolute bg-rose-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center px-2 gap-1.5 text-white"
      >
        <span className="text-sm sm:text-xl">🇻🇳 🔊</span>
        <span className="font-extrabold text-[clamp(9px,1.25vw,18px)] truncate">
          Nghe tiếng Việt
        </span>
      </div>

      {/* Bottom Center-Right: Listen in English */}
      <div
        style={{ left: '50.8%', top: '86.8%', width: '22%', height: '10.4%' }}
        className="absolute bg-blue-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center px-2 gap-1.5 text-white"
      >
        <span className="text-sm sm:text-xl">🇬🇧 🔊</span>
        <span className="font-extrabold text-[clamp(9px,1.25vw,18px)] truncate">
          Listen in English
        </span>
      </div>

      {/* Bottom Right: Lễ hội tiếp theo */}
      <div
        style={{ left: '81.5%', top: '86.8%', width: '17.7%', height: '9%' }}
        className="absolute bg-white rounded-full border-4 border-pink-400 shadow-lg flex items-center justify-between px-2 gap-1.5"
      >
        <span className="text-rose-600 font-black text-[clamp(8px,1.15vw,16px)] truncate">
          Lễ hội tiếp theo
        </span>
        <span className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shrink-0">
          ➜
        </span>
      </div>
    </div>
  );
};

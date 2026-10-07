import React, { useState } from 'react';
import { AudioSlotKey, ImageScreenKey } from '../data/appData';

interface AssetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customImages: Record<string, string | null>;
  customAudios: Record<string, string | null>;
  onUploadSingleAsset: (type: 'image' | 'audio', key: string, file: File) => Promise<void>;
  onBatchUploadFiles: (files: FileList) => Promise<void>;
}

const IMAGE_SLOTS: { key: ImageScreenKey; label: string }[] = [
  { key: 'TRANG-BIA', label: '1. TRANG-BIA (Trang bìa chính)' },
  { key: 'PHAN-1', label: '2. PHAN-1 (Bản đồ Du hành lễ hội)' },
  { key: 'HOA-ANH-DAO', label: '3. HOA-ANH-DAO (Lễ hội Hoa anh đào)' },
  { key: 'BUP-BE', label: '4. BUP-BE (Lễ hội Búp bê)' },
  { key: 'TET-THIEU-NHI', label: '5. TET-THIEU-NHI (Tết Thiếu nhi)' },
  { key: 'LE-HOI-KHAC', label: '6. LE-HOI-KHAC (Một số lễ hội khác)' },
];

const AUDIO_SLOTS: { key: AudioSlotKey; label: string }[] = [
  { key: 'hoa-anh-dao-vi', label: 'Lễ hội Hoa anh đào – Nghe tiếng Việt' },
  { key: 'hoa-anh-dao-en', label: 'Lễ hội Hoa anh đào – Listen in English' },
  { key: 'bup-be-vi', label: 'Lễ hội Búp bê – Nghe tiếng Việt' },
  { key: 'bup-be-en', label: 'Lễ hội Búp bê – Listen in English' },
  { key: 'tet-thieu-nhi-vi', label: 'Tết Thiếu nhi – Nghe tiếng Việt' },
  { key: 'tet-thieu-nhi-en', label: 'Tết Thiếu nhi – Listen in English' },
];

export const AssetManagerModal: React.FC<AssetManagerModalProps> = ({
  isOpen,
  onClose,
  customImages,
  customAudios,
  onUploadSingleAsset,
  onBatchUploadFiles,
}) => {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSingleFile = async (type: 'image' | 'audio', key: string, file?: File) => {
    if (!file) return;
    setUploadingKey(key);
    try {
      await onUploadSingleAsset(type, key, file);
    } finally {
      setUploadingKey(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border-4 border-pink-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-rose-100 pb-4 mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-rose-600">
              📁 Quản lý 6 Ảnh Giao Diện Gốc & File Audio
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Tải lên 6 ảnh thiết kế sẵn (16:9) và các file thu âm tiếng Việt / tiếng Anh cho từng
              lễ hội.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 font-black flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Fast Batch Upload Box */}
        <div className="bg-amber-50 border-2 border-dashed border-amber-400 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-extrabold text-amber-900 text-sm sm:text-base">
              ⚡ Tải nhanh tất cả cùng lúc
            </div>
            <p className="text-xs sm:text-sm text-amber-800">
              Chọn cùng lúc cả 6 ảnh (TRANG-BIA, PHAN-1, HOA-ANH-DAO, BUP-BE, TET-THIEU-NHI,
              LE-HOI-KHAC), ứng dụng sẽ tự động nhận diện theo tên file!
            </p>
          </div>
          <label className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-5 py-2.5 rounded-xl shadow cursor-pointer text-sm">
            📂 Chọn nhiều file một lúc
            <input
              type="file"
              multiple
              accept="image/*,audio/*"
              className="hidden"
              onChange={async (e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setUploadingKey('batch');
                  await onBatchUploadFiles(e.target.files);
                  setUploadingKey(null);
                  e.target.value = '';
                }
              }}
            />
          </label>
        </div>

        {/* 6 Screen Images Section */}
        <h3 className="font-black text-base sm:text-lg text-slate-800 mb-3">
          🖼️ 6 Ảnh Giao Diện Thiết Kế Sẵn (Tỉ lệ 16:9)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {IMAGE_SLOTS.map((slot) => {
            const url = customImages[slot.key];
            return (
              <div
                key={slot.key}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {url ? (
                    <img
                      src={url}
                      alt={slot.key}
                      referrerPolicy="no-referrer"
                      className="w-16 h-9 object-cover rounded-lg border border-emerald-400 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-9 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center text-xs font-bold shrink-0">
                      16:9
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                      {slot.label}
                    </div>
                    <div className="text-xs font-semibold">
                      {url ? (
                        <span className="text-emerald-600">✓ Đã nạp ảnh gốc</span>
                      ) : (
                        <span className="text-amber-600">Đang dùng khung mặc định</span>
                      )}
                    </div>
                  </div>
                </div>
                <label className="shrink-0 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer">
                  {uploadingKey === slot.key ? 'Đang lưu...' : url ? 'Đổi ảnh' : 'Tải ảnh'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSingleFile('image', slot.key, e.target.files?.[0])}
                  />
                </label>
              </div>
            );
          })}
        </div>

        {/* 6 Custom Audio Slots Section */}
        <h3 className="font-black text-base sm:text-lg text-slate-800 mb-2">
          🔊 File Audio Thuyết Minh Phần 1 (Tùy chọn)
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Nếu chưa tải file audio riêng, ứng dụng sẽ tự động đọc bằng giọng AI chuẩn khi bấm vào
          hotspot “Nghe tiếng Việt” hoặc “Listen in English”.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AUDIO_SLOTS.map((slot) => {
            const url = customAudios[slot.key];
            return (
              <div
                key={slot.key}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                    {slot.label}
                  </div>
                  <div className="text-xs font-semibold">
                    {url ? (
                      <span className="text-emerald-600">✓ Đã có file audio riêng</span>
                    ) : (
                      <span className="text-sky-600">Đang dùng giọng đọc tự động</span>
                    )}
                  </div>
                </div>
                <label className="shrink-0 bg-white hover:bg-sky-50 text-sky-700 border border-sky-300 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer">
                  {uploadingKey === slot.key ? 'Đang lưu...' : url ? 'Đổi Audio' : 'Tải Audio'}
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleSingleFile('audio', slot.key, e.target.files?.[0])}
                  />
                </label>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-6 py-2.5 rounded-2xl shadow cursor-pointer"
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

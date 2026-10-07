/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AssetManagerModal } from './components/AssetManagerModal';
import { CompletionScreen } from './components/CompletionScreen';
import { ExplorerQuizScreen } from './components/ExplorerQuizScreen';
import { ImageHotspotScreen } from './components/ImageHotspotScreen';
import { SmartVocabScreen } from './components/SmartVocabScreen';
import { ImageScreenKey, ScreenId } from './data/appData';
import { audioManager } from './services/audioManager';

function normalizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[_\s]+/g, '-');
}

function matchImageKeyFromFileName(fileName: string): ImageScreenKey | null {
  const norm = normalizeFileName(fileName);
  if (norm.includes('TRANG-BIA') || norm.includes('BIA')) return 'TRANG-BIA';
  if (norm.includes('PHAN-1') || norm.includes('PHAN1') || norm.includes('BAN-DO')) return 'PHAN-1';
  if (norm.includes('HOA-ANH-DAO') || norm.includes('ANH-DAO')) return 'HOA-ANH-DAO';
  if (norm.includes('BUP-BE')) return 'BUP-BE';
  if (norm.includes('TET-THIEU-NHI') || norm.includes('THIEU-NHI')) return 'TET-THIEU-NHI';
  if (norm.includes('LE-HOI-KHAC') || norm.includes('KHAC')) return 'LE-HOI-KHAC';
  return null;
}

function matchAudioKeyFromFileName(fileName: string): string | null {
  const norm = normalizeFileName(fileName);
  const isEn = norm.includes('-EN') || norm.includes('ENGLISH') || norm.includes('TIENG-ANH');
  if (norm.includes('HOA-ANH-DAO') || norm.includes('ANH-DAO')) {
    return isEn ? 'hoa-anh-dao-en' : 'hoa-anh-dao-vi';
  }
  if (norm.includes('BUP-BE')) {
    return isEn ? 'bup-be-en' : 'bup-be-vi';
  }
  if (norm.includes('TET-THIEU-NHI') || norm.includes('THIEU-NHI')) {
    return isEn ? 'tet-thieu-nhi-en' : 'tet-thieu-nhi-vi';
  }
  return null;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('TRANG-BIA');
  const [quizResetCounter, setQuizResetCounter] = useState(0);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  const [customImages, setCustomImages] = useState<Record<string, string | null>>({
    'TRANG-BIA': null,
    'PHAN-1': null,
    'HOA-ANH-DAO': null,
    'BUP-BE': null,
    'TET-THIEU-NHI': null,
    'LE-HOI-KHAC': null,
  });

  const [customAudios, setCustomAudios] = useState<Record<string, string | null>>({
    'hoa-anh-dao-vi': null,
    'hoa-anh-dao-en': null,
    'bup-be-vi': null,
    'bup-be-en': null,
    'tet-thieu-nhi-vi': null,
    'tet-thieu-nhi-en': null,
  });

  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateFsState = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', updateFsState);
    document.addEventListener('webkitfullscreenchange', updateFsState);
    document.addEventListener('mozfullscreenchange', updateFsState);
    document.addEventListener('MSFullscreenChange', updateFsState);

    return () => {
      document.removeEventListener('fullscreenchange', updateFsState);
      document.removeEventListener('webkitfullscreenchange', updateFsState);
      document.removeEventListener('mozfullscreenchange', updateFsState);
      document.removeEventListener('MSFullscreenChange', updateFsState);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      const isFs = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isFs) {
        const docEl = document.documentElement as any;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          docEl.msRequestFullscreen();
        }
      } else {
        const doc = document as any;
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {});
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen();
        }
      }
    } catch {
      // Safe fallback if Fullscreen API is disabled or unsupported
    }
  };

  useEffect(() => {
    const unsub = audioManager.subscribe((state) => {
      setActiveAudioId(state.activeId);
      setIsAudioLoading(state.isLoading);
    });
    return unsub;
  }, []);

  // Load any saved assets from the server (/public/images & /public/audio) on mount
  useEffect(() => {
    fetch('/api/assets-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.images) {
          setCustomImages((prev) => ({ ...prev, ...data.images }));
        }
        if (data.audios) {
          setCustomAudios((prev) => ({ ...prev, ...data.audios }));
        }
      })
      .catch(() => {
        // Ignore initial fetch error
      });
  }, []);

  const handleNavigate = (target: ScreenId) => {
    audioManager.stopAll();
    setCurrentScreen(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUploadSingleAsset = async (
    type: 'image' | 'audio',
    key: string,
    file: File
  ): Promise<void> => {
    const dataUrl = await fileToDataUrl(file);
    const localBlobUrl = URL.createObjectURL(file);

    if (type === 'image') {
      setCustomImages((prev) => ({ ...prev, [key]: localBlobUrl }));
    } else {
      setCustomAudios((prev) => ({ ...prev, [key]: localBlobUrl }));
    }

    try {
      const res = await fetch('/api/save-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, key, dataUrl }),
      });
      if (res.ok) {
        const saved = await res.json();
        if (saved.url) {
          if (type === 'image') {
            setCustomImages((prev) => ({ ...prev, [key]: saved.url }));
          } else {
            setCustomAudios((prev) => ({ ...prev, [key]: saved.url }));
          }
        }
      }
    } catch {
      // Keep localBlobUrl in session if server save fails
    }
  };

  const handleBatchUploadFiles = async (files: FileList): Promise<void> => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      if (file.type.startsWith('image/')) {
        const matchedKey = matchImageKeyFromFileName(file.name);
        if (matchedKey) {
          await handleUploadSingleAsset('image', matchedKey, file);
        }
      } else if (file.type.startsWith('audio/')) {
        const matchedAudioKey = matchAudioKeyFromFileName(file.name);
        if (matchedAudioKey) {
          await handleUploadSingleAsset('audio', matchedAudioKey, file);
        }
      }
    }
  };

  const isImageScreen = (screen: ScreenId): screen is ImageScreenKey => {
    return (
      screen === 'TRANG-BIA' ||
      screen === 'PHAN-1' ||
      screen === 'HOA-ANH-DAO' ||
      screen === 'BUP-BE' ||
      screen === 'TET-THIEU-NHI' ||
      screen === 'LE-HOI-KHAC'
    );
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden relative">
      {/* Nút bật/tắt chế độ toàn màn hình (Fullscreen) - luôn hiển thị trên tất cả các trang */}
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Bật toàn màn hình'}
        title={isFullscreen ? 'Thoát toàn màn hình (ESC)' : 'Bật toàn màn hình'}
        className="fixed top-2.5 right-2.5 sm:top-3 sm:right-3.5 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900/60 hover:bg-slate-900/85 active:scale-95 text-white/90 hover:text-white backdrop-blur-md border border-white/30 shadow-lg transition-all duration-150 cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 select-none"
      >
        {isFullscreen ? (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3v3a2 2 0 0 1-2 2H3" />
            <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
            <path d="M3 16h3a2 2 0 0 1 2 2v3" />
            <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        )}
      </button>

      {isImageScreen(currentScreen) && (
        <ImageHotspotScreen
          screenKey={currentScreen}
          customImages={customImages}
          customAudios={customAudios}
          activeAudioId={activeAudioId}
          isAudioLoading={isAudioLoading}
          onNavigate={handleNavigate}
          onOpenAssetModal={() => setIsAssetModalOpen(true)}
          onQuickUploadFiles={handleBatchUploadFiles}
        />
      )}

      {currentScreen === 'PHAN-2' && (
        <SmartVocabScreen
          activeAudioId={activeAudioId}
          isAudioLoading={isAudioLoading}
          onNavigate={handleNavigate}
        />
      )}

      {currentScreen === 'PHAN-3' && (
        <ExplorerQuizScreen
          activeAudioId={activeAudioId}
          onNavigate={handleNavigate}
          resetTrigger={quizResetCounter}
        />
      )}

      {currentScreen === 'HOAN-THANH' && (
        <CompletionScreen
          onNavigate={handleNavigate}
          onRetryQuiz={() => {
            setQuizResetCounter((c) => c + 1);
            handleNavigate('PHAN-3');
          }}
        />
      )}

      <AssetManagerModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        customImages={customImages}
        customAudios={customAudios}
        onUploadSingleAsset={handleUploadSingleAsset}
        onBatchUploadFiles={handleBatchUploadFiles}
      />
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CompletionScreen } from './components/CompletionScreen';
import { ExplorerQuizScreen } from './components/ExplorerQuizScreen';
import { ImageHotspotScreen } from './components/ImageHotspotScreen';
import { SmartVocabScreen } from './components/SmartVocabScreen';
import { ImageScreenKey, ScreenId } from './data/appData';
import { audioManager } from './services/audioManager';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('TRANG-BIA');
  const [quizResetCounter, setQuizResetCounter] = useState(0);

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

  const handleNavigate = (target: ScreenId) => {
    audioManager.stopAll();
    setCurrentScreen(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          activeAudioId={activeAudioId}
          isAudioLoading={isAudioLoading}
          onNavigate={handleNavigate}
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
    </div>
  );
}

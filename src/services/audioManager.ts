type AudioStateListener = (state: { activeId: string | null; isLoading: boolean }) => void;

class GlobalAudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private activeId: string | null = null;
  private isLoading = false;
  private listeners = new Set<AudioStateListener>();
  private ttsBlobUrlCache = new Map<string, string>();
  private requestToken = 0;
  private audioCtx: AudioContext | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeGainNodes: GainNode[] = [];

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return null;
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  stopSoundEffects() {
    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    }
    this.activeOscillators = [];

    for (const gain of this.activeGainNodes) {
      try {
        gain.disconnect();
      } catch {}
    }
    this.activeGainNodes = [];
  }

  /**
   * Cheerful, bright, short melodic sound for correct answers (elementary school friendly)
   */
  playCorrectSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    this.stopSoundEffects();

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0, duration: 0.1 },      // C5
      { freq: 659.25, time: 0.08, duration: 0.1 },   // E5
      { freq: 783.99, time: 0.16, duration: 0.22 },  // G5
      { freq: 1046.50, time: 0.20, duration: 0.2 },  // C6 sparkle
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0.001, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.2, now + note.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration);

      this.activeOscillators.push(osc);
      this.activeGainNodes.push(gain);

      osc.onended = () => {
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
        this.activeGainNodes = this.activeGainNodes.filter((g) => g !== gain);
      };
    }
  }

  /**
   * Gentle, soft, encouraging "try again" sound (never harsh or negative)
   */
  playIncorrectSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    this.stopSoundEffects();

    const now = ctx.currentTime;
    const notes = [
      { freq: 329.63, time: 0, duration: 0.12 },    // E4
      { freq: 261.63, time: 0.10, duration: 0.16 },  // C4
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0.001, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.14, now + note.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration);

      this.activeOscillators.push(osc);
      this.activeGainNodes.push(gain);

      osc.onended = () => {
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
        this.activeGainNodes = this.activeGainNodes.filter((g) => g !== gain);
      };
    }
  }

  /**
   * Cheerful, joyful completion sound for open-ended questions (Câu 4 & 5)
   */
  playCompleteSound() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    this.stopSoundEffects();

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0, duration: 0.09 },      // C5
      { freq: 659.25, time: 0.08, duration: 0.09 },   // E5
      { freq: 783.99, time: 0.16, duration: 0.12 },   // G5
      { freq: 1046.50, time: 0.24, duration: 0.25 },  // C6
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0.001, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.18, now + note.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration);

      this.activeOscillators.push(osc);
      this.activeGainNodes.push(gain);

      osc.onended = () => {
        this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
        this.activeGainNodes = this.activeGainNodes.filter((g) => g !== gain);
      };
    }
  }

  subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    listener({ activeId: this.activeId, isLoading: this.isLoading });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ activeId: this.activeId, isLoading: this.isLoading });
    }
  }

  stopAll() {
    this.requestToken++;
    this.stopSoundEffects();
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
      } catch {
        // Ignore cleanup errors
      }
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore speechSynthesis cancel errors
      }
    }

    this.activeId = null;
    this.isLoading = false;
    this.notify();
  }

  /**
   * Play student's own recorded audio blob URL (strictly never TTS)
   */
  async playRecordedBlob(id: string, blobUrl: string): Promise<void> {
    this.stopAll();
    const myToken = ++this.requestToken;
    this.activeId = id;
    this.isLoading = false;
    this.notify();

    return new Promise((resolve) => {
      const audio = new Audio(blobUrl);
      this.currentAudio = audio;

      audio.onended = () => {
        if (this.requestToken === myToken) {
          this.activeId = null;
          this.currentAudio = null;
          this.notify();
        }
        resolve();
      };

      audio.onerror = () => {
        if (this.requestToken === myToken) {
          this.activeId = null;
          this.currentAudio = null;
          this.notify();
        }
        resolve();
      };

      audio.play().catch(() => {
        if (this.requestToken === myToken) {
          this.activeId = null;
          this.currentAudio = null;
          this.notify();
        }
        resolve();
      });
    });
  }

  /**
   * Play a custom uploaded audio file if available, or fall back to server Gemini TTS / Web Speech API.
   * Clicking again replays from the beginning (0:00). Never allows two audios to play simultaneously.
   */
  async playAudioOrTTS(options: {
    id: string;
    customAudioUrl?: string | null;
    text: string;
    lang: 'en' | 'vi';
  }): Promise<void> {
    const { id, customAudioUrl, text, lang } = options;

    // Always stop any currently running audio first
    this.stopAll();
    const myToken = ++this.requestToken;
    this.activeId = id;
    this.isLoading = true;
    this.notify();

    // 1. If a custom audio file URL is provided, play it directly from the start
    if (customAudioUrl) {
      const playedCustom = await this.tryPlayUrl(customAudioUrl, myToken);
      if (playedCustom || this.requestToken !== myToken) {
        return;
      }
    }

    // 2. Check client-side TTS cache
    const cacheKey = `${lang}:${text.trim()}`;
    const cachedBlobUrl = this.ttsBlobUrlCache.get(cacheKey);
    if (cachedBlobUrl) {
      await this.tryPlayUrl(cachedBlobUrl, myToken);
      return;
    }

    // 3. Request server-side Gemini TTS
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
      });

      if (this.requestToken !== myToken) return;

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64 && this.requestToken === myToken) {
          const binary = atob(data.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
          const blobUrl = URL.createObjectURL(blob);
          this.ttsBlobUrlCache.set(cacheKey, blobUrl);

          const played = await this.tryPlayUrl(blobUrl, myToken);
          if (played) return;
        }
      }
    } catch {
      // Fall through to browser speechSynthesis fallback
    }

    if (this.requestToken !== myToken) return;

    // 4. Fallback to Web Speech API
    this.playBrowserSpeechFallback(text, lang, myToken);
  }

  private tryPlayUrl(url: string, token: number): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.requestToken !== token) {
        resolve(false);
        return;
      }

      const audio = new Audio(url);
      this.currentAudio = audio;

      audio.oncanplay = () => {
        if (this.requestToken === token) {
          this.isLoading = false;
          this.notify();
        }
      };

      audio.onended = () => {
        if (this.requestToken === token) {
          this.activeId = null;
          this.isLoading = false;
          this.currentAudio = null;
          this.notify();
        }
        resolve(true);
      };

      audio.onerror = () => {
        if (this.requestToken === token) {
          this.currentAudio = null;
        }
        resolve(false);
      };

      audio
        .play()
        .then(() => {
          if (this.requestToken === token) {
            this.isLoading = false;
            this.notify();
          }
        })
        .catch(() => {
          resolve(false);
        });
    });
  }

  private playBrowserSpeechFallback(text: string, lang: 'en' | 'vi', token: number) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.activeId = null;
      this.isLoading = false;
      this.notify();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'en' ? 'en-US' : 'vi-VN';
      utterance.rate = lang === 'en' ? 0.85 : 0.92;
      utterance.pitch = 1.05;

      const pickVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find((v) =>
          lang === 'en'
            ? v.lang.startsWith('en-US') || v.lang.startsWith('en-GB') || v.lang.startsWith('en')
            : v.lang.startsWith('vi')
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      };

      pickVoice();
      if (!utterance.voice && window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          pickVoice();
        };
      }

      utterance.onstart = () => {
        if (this.requestToken === token) {
          this.isLoading = false;
          this.notify();
        }
      };

      utterance.onend = () => {
        if (this.requestToken === token) {
          this.activeId = null;
          this.isLoading = false;
          this.currentAudio = null;
          this.notify();
        }
      };

      utterance.onerror = () => {
        if (this.requestToken === token) {
          this.activeId = null;
          this.isLoading = false;
          this.currentAudio = null;
          this.notify();
        }
      };

      this.isLoading = false;
      this.notify();

      setTimeout(() => {
        if (this.requestToken === token) {
          window.speechSynthesis.speak(utterance);
        }
      }, 30);
    } catch {
      this.activeId = null;
      this.isLoading = false;
      this.notify();
    }
  }
}

export const audioManager = new GlobalAudioManager();

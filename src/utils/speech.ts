/* eslint-disable @typescript-eslint/no-explicit-any */
// Browser Web Speech API wrappers for TTS and STT

export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return [];
  }
  return window.speechSynthesis.getVoices();
};

let activeUtterance: SpeechSynthesisUtterance | null = null;
let cancelTimeout: ReturnType<typeof setTimeout> | null = null;

export const speak = (
  text: string,
  voiceName?: string,
  rate: number = 1.0,
  pitch: number = 1.0
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      reject(new Error('Speech Synthesis is not supported in this browser.'));
      return;
    }

    // Cancel any active speech
    window.speechSynthesis.cancel();
    if (cancelTimeout) {
      clearTimeout(cancelTimeout);
      cancelTimeout = null;
    }

    // Use a small delay to let the cancel finish before speaking to avoid Chromium bug
    cancelTimeout = setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        activeUtterance = utterance; // Retain reference to prevent garbage collection

        utterance.lang = 'en-US';
        utterance.rate = rate;
        utterance.pitch = pitch;

        if (voiceName) {
          const voices = window.speechSynthesis.getVoices();
          const selectedVoice = voices.find(v => v.name === voiceName);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }

        utterance.onend = () => {
          if (activeUtterance === utterance) {
            activeUtterance = null;
          }
          resolve();
        };

        utterance.onerror = (e) => {
          if (activeUtterance === utterance) {
            activeUtterance = null;
          }
          reject(e);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        reject(err);
      }
    }, 100);
  });
};

export const stopSpeaking = (): void => {
  if (cancelTimeout) {
    clearTimeout(cancelTimeout);
    cancelTimeout = null;
  }
  activeUtterance = null;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const pauseSpeaking = (): void => {
  if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }
};

export const resumeSpeaking = (): void => {
  if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
};

export const isSpeechPaused = (): boolean => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.paused;
  }
  return false;
};

export interface RecognitionResult {
  transcript: string;
  confidence: number;
}

export class SpeechRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public start(
    onResult: (result: RecognitionResult) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): void {
    if (!this.recognition) {
      onError('Speech Recognition not supported in this browser.');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    }

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      if (result && result[0]) {
        onResult({
          transcript: result[0].transcript,
          confidence: result[0].confidence,
        });
      }
    };

    this.recognition.onerror = (event: any) => {
      onError(event.error || 'Speech recognition error');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (e: any) {
      onError(e.message || 'Failed to start speech recognition');
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }
}

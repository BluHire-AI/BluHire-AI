import { useState, useEffect, useCallback, useRef } from 'react';

export interface VoiceSettings {
  language?: string;
  pitch?: number;
  rate?: number;
  voiceURI?: string;
}

export type SpeechStatus = 'IDLE' | 'SPEAKING' | 'PAUSED' | 'ERROR';

export function useVoiceEngine(settings?: VoiceSettings) {
  const [status, setStatus] = useState<SpeechStatus>('IDLE');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Populate available voices
    const populateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    populateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        console.trace('SpeechSynthesis Cancel Triggered (Unmount)');
        window.speechSynthesis.cancel(); // Stop speaking if component unmounts
      }
    };
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) {
      console.error('Speech Synthesis API is not supported in this browser.');
      setStatus('ERROR');
      return;
    }

    // Cancel any ongoing speech
    console.trace('SpeechSynthesis Cancel Triggered (New Speak)');
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply settings
    utterance.lang = settings?.language || 'en-US';
    utterance.pitch = settings?.pitch || 1.0;
    utterance.rate = settings?.rate || 1.0;

    if (settings?.voiceURI) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.voiceURI === settings.voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Default to a female English voice if possible
        const defaultVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Female')) 
          || voices.find(v => v.lang.includes('en'));
        if (defaultVoice) {
          utterance.voice = defaultVoice;
        }
      }
    }

    utterance.onstart = () => setStatus('SPEAKING');
    utterance.onpause = () => setStatus('PAUSED');
    utterance.onresume = () => setStatus('SPEAKING');
    utterance.onend = () => {
      setStatus('IDLE');
      if (onEnd) onEnd();
    };
    utterance.onerror = (e) => {
      // Browsers often fire 'interrupted' or 'canceled' when stopping speech manually. 
      // We don't want to show this as a scary console error.
      if (e.error === 'interrupted' || e.error === 'canceled') {
        console.warn(`SpeechSynthesis ${e.error} (expected behavior on stop/unmount)`);
      } else {
        console.error('SpeechSynthesis error:', e);
      }
      setStatus('ERROR');
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [settings]);

  const pause = useCallback(() => {
    if (window.speechSynthesis && status === 'SPEAKING') {
      window.speechSynthesis.pause();
    }
  }, [status]);

  const resume = useCallback(() => {
    if (window.speechSynthesis && status === 'PAUSED') {
      window.speechSynthesis.resume();
    }
  }, [status]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      console.trace('SpeechSynthesis Cancel Triggered (Stop Called)');
      window.speechSynthesis.cancel();
      setStatus('IDLE');
    }
  }, []);

  return {
    status,
    availableVoices,
    speak,
    pause,
    resume,
    stop,
  };
}

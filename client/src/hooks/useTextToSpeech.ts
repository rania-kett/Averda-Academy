import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

void supabase;

export function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { language } = useLanguage();

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (isLoading) return;
    
    // Stop any currently playing audio
    stop();
    
    setIsLoading(true);
    setError(null);

    try {
      // Call the ElevenLabs edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, language, speed }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      const data = await response.json();
      
      if (!data.audioContent) {
        throw new Error('No audio content received');
      }

      // Use data URI for base64 audio - browser handles decoding
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setError('Failed to play audio');
        setIsPlaying(false);
        setIsLoading(false);
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error('Text-to-speech error (using browser fallback):', err);
      setIsLoading(false);
      
      // Fallback to browser TTS if ElevenLabs fails
      if (window.speechSynthesis) {
        setError(null); // Clear error since we're using fallback
        const utterance = new SpeechSynthesisUtterance(text);
        const langMap: Record<string, string> = {
          'fr': 'fr-FR',
          'ar': 'ar-SA',
          'ma': 'ar-MA',
          'en': 'en-US',
        };
        utterance.lang = langMap[language] || 'ar-MA';
        utterance.rate = speed; // Apply user's speed preference
        
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => {
          setError('Speech synthesis failed');
          setIsPlaying(false);
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        setError('Text-to-speech not available');
      }
    }
  }, [language, isLoading, stop]);

  return { speak, stop, isPlaying, isLoading, error, speed, setSpeed };
}


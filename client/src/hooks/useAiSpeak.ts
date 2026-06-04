import { useCallback, useRef, useState } from "react";
import { aiApi } from "@/api/api";

export function useAiSpeak() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const stop = useCallback(() => {
    try {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
    } catch {
      /* ignore */
    }
    audioRef.current = null;
    setIsPlaying(false);
  }, []);

  const speakCourse = useCallback(
    async (opts: { courseId: string; lang: "ar" | "fr" | "en" }) => {
      if (isLoading) return;
      if (isPlaying) {
        stop();
        return;
      }
      setIsLoading(true);
      stop();
      try {
        const res = await aiApi.speak({ courseId: opts.courseId, lang: opts.lang });
        const blob = res.data as Blob;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => {
          setIsPlaying(false);
          try {
            URL.revokeObjectURL(url);
          } catch {
            /* ignore */
          }
          audioRef.current = null;
        };
        audio.onerror = () => {
          setIsPlaying(false);
          audioRef.current = null;
        };
        await audio.play();
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, isPlaying, stop]
  );

  return { speakCourse, stop, isPlaying, isLoading };
}


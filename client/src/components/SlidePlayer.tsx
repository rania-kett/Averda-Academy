import { useEffect, useMemo, useState } from "react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { SoundButton } from "@/components/SoundButton";

export interface Slide {
  id: string;
  title: string;
  content: string;
  visual?: React.ReactNode;
}

export function SlidePlayer({
  slides,
  currentIndex,
  onNext,
  onPrev,
  onSkip,
  onStopReady,
}: {
  slides: Slide[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  /** Optional: lets parent stop audio before navigation (existing nav buttons). */
  onStopReady?: (stop: () => void) => void;
}) {
  const { speak, stop, isPlaying, isLoading, error } = useTextToSpeech();
  const [armed, setArmed] = useState(false);

  const slide = slides[currentIndex];
  const total = slides.length;

  useEffect(() => {
    onStopReady?.(stop);
  }, [onStopReady, stop]);

  // Per requirements: do NOT autoplay. Reset to OFF on each new slide.
  useEffect(() => {
    stop();
    setArmed(false);
  }, [currentIndex, stop]);

  const progress = useMemo(() => {
    const safeTotal = Math.max(1, total);
    const idx = Math.min(Math.max(0, currentIndex), safeTotal - 1);
    return { idx, safeTotal };
  }, [currentIndex, total]);

  const toggle = async () => {
    if (!slide) return;
    if (isPlaying || armed) {
      stop();
      setArmed(false);
      return;
    }
    setArmed(true);
    await speak(slide.content);
  };

  // If audio naturally ends, keep it OFF (button returns to muted state).
  useEffect(() => {
    if (!isPlaying && !isLoading) {
      setArmed(false);
    }
  }, [isLoading, isPlaying]);

  if (!slide) return null;

  const speakerOn = isPlaying || isLoading;

  return (
    <div className="w-full" dir="rtl">
      {/* Progress segments */}
      <div className="mb-4 flex items-center gap-1.5">
        {Array.from({ length: progress.safeTotal }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{
              background:
                i <= progress.idx
                  ? "rgba(59,130,246,0.95)"
                  : "rgba(231,229,228,1)",
            }}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-sm dark:border-[#44403C] dark:bg-[#0D1117]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[18px] font-extrabold leading-snug text-[#1C1917] dark:text-[#F5F5F4]">
              {slide.title}
            </h2>
          </div>

          <SoundButton
            onClick={() => void toggle()}
            ariaLabel={speakerOn ? "إيقاف الصوت" : "تشغيل الصوت"}
          />
        </div>

        <div className="mt-4 space-y-4">
          {slide.visual ? <div className="overflow-hidden rounded-xl">{slide.visual}</div> : null}

          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#292524] dark:text-stone-200">
            {slide.content}
          </p>

          {error ? (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      {/* Intentionally no nav buttons: parent wires onNext/onPrev/onSkip and must call stop() before navigation. */}
      <div className="sr-only">
        <button type="button" onClick={() => { stop(); onPrev(); }}>
          prev
        </button>
        <button type="button" onClick={() => { stop(); onNext(); }}>
          next
        </button>
        <button type="button" onClick={() => { stop(); onSkip(); }}>
          skip
        </button>
      </div>
    </div>
  );
}


interface WaveformBarsProps {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
}

const DELAYS = [0, 0.12, 0.06, 0.18, 0.09, 0.15, 0.03];
const DURATIONS = [0.5, 0.65, 0.55, 0.7, 0.6, 0.45, 0.58];

export default function WaveformBars({
  isPlaying,
  barCount = 7,
  className = '',
}: WaveformBarsProps) {
  return (
    <>
      <style>{`
        @keyframes waveBarMobile {
          0%, 100% { height: 4px; }
          50% { height: 22px; }
        }
      `}</style>
      <div
        className={`flex items-end gap-[3px] ${className}`}
        style={{ height: 24 }}
        aria-hidden="true"
      >
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 4,
              borderRadius: 2,
              backgroundColor: 'currentColor',
              height: isPlaying ? undefined : 4,
              minHeight: 4,
              animation: isPlaying
                ? `waveBarMobile ${DURATIONS[i % DURATIONS.length]}s ease-in-out ${DELAYS[i % DELAYS.length]}s infinite`
                : 'none',
            }}
          />
        ))}
      </div>
    </>
  );
}

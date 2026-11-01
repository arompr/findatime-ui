type HeatmapLegendProps = {
  /** How many other participants have shared availability. */
  respondedCount: number;
};

const LEVELS = [1, 2, 3, 4] as const;

export function HeatmapLegend({ respondedCount }: HeatmapLegendProps) {
  if (respondedCount === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
      <span>
        {respondedCount === 1
          ? "1 other person has"
          : `${respondedCount} other people have`}{" "}
        shared availability
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="flex items-center gap-0.5"
          aria-hidden
        >
          {LEVELS.map((level) => (
            <span
              key={level}
              className={`findatime-heat-${level} h-3 w-3 rounded-[3px]`}
            />
          ))}
        </span>
        <span>= 1 to 4+ people free</span>
      </span>
    </div>
  );
}

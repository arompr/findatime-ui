import { Sparkles, Target } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatDayLabel, formatTimeRange } from "@/lib/time";

export type ParticipantStatus = {
  id: string;
  name: string;
  responded: boolean;
  isMe: boolean;
};

export type BestTime = {
  startMs: number;
  endMs: number;
  count: number;
};

type ResponsesSummaryProps = {
  participants: ParticipantStatus[];
  bestTimes: BestTime[];
  total: number;
  /** Highest overlap anywhere on the calendar. */
  peakCount: number;
  highlightBest: boolean;
  onHighlightBestChange: (value: boolean) => void;
  onBestTimeClick: (startMs: number) => void;
};

const LEVELS = [1, 2, 3, 4] as const;
const MAX_AVATARS = 6;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const letters =
    parts.length > 1
      ? parts[0][0] + parts[parts.length - 1][0]
      : name.slice(0, 2);
  return letters.toUpperCase();
}

function Avatar({ participant }: { participant: ParticipantStatus }) {
  const label = `${participant.isMe ? `${participant.name} (you)` : participant.name} · ${
    participant.responded ? "added their times" : "hasn't responded yet"
  }`;
  return (
    <Tooltip
      content={label}
      className="relative -ml-1.5 first:ml-0 hover:z-10 focus-within:z-10"
    >
      <span
        tabIndex={0}
        aria-label={label}
        className={`relative inline-flex size-8 cursor-default items-center justify-center rounded-full border-2 border-card text-[11px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          participant.responded
            ? "bg-brand/20 text-foreground"
            : "bg-secondary text-muted-foreground"
        }`}
      >
        {initials(participant.name)}
        {participant.responded && (
          <span
            aria-hidden
            className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-success"
          />
        )}
      </span>
    </Tooltip>
  );
}

function freeLabel(count: number, total: number): string {
  return count >= total ? "Everyone free" : `${count} of ${total} free`;
}

export function ResponsesSummary({
  participants,
  bestTimes,
  total,
  peakCount,
  highlightBest,
  onHighlightBestChange,
  onBestTimeClick,
}: ResponsesSummaryProps) {
  const responded = participants.filter(
    (participant) => participant.responded,
  ).length;
  const shown = participants.slice(0, MAX_AVATARS);
  const hidden = participants.slice(MAX_AVATARS);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            {shown.map((participant) => (
              <Avatar key={participant.id} participant={participant} />
            ))}
            {hidden.length > 0 && (
              <Tooltip
                content={hidden
                  .map((participant) => participant.name)
                  .join(", ")}
                className="-ml-1.5"
              >
                <span
                  tabIndex={0}
                  className="inline-flex size-8 cursor-default items-center justify-center rounded-full border-2 border-card bg-secondary text-[11px] font-semibold text-muted-foreground"
                >
                  +{hidden.length}
                </span>
              </Tooltip>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">
              {responded} of {participants.length}
            </span>{" "}
            responded
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {highlightBest ? (
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="findatime-heat-4 size-3.5 rounded-[4px] border border-border"
                aria-hidden
              />
              {freeLabel(peakCount, total)}
            </span>
          ) : (
            <Tooltip content="Darker means more people are free; darkest means everyone">
              <span
                tabIndex={0}
                className="inline-flex cursor-default items-center gap-2 rounded-md text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Fewer
                <span className="flex gap-0.5" aria-hidden>
                  {LEVELS.map((level) => (
                    <span
                      key={level}
                      className={`findatime-heat-${level} size-3.5 rounded-[4px] border border-border`}
                    />
                  ))}
                </span>
                Everyone
              </span>
            </Tooltip>
          )}
          {peakCount >= 2 && (
            <button
              type="button"
              aria-pressed={highlightBest}
              onClick={() => onHighlightBestChange(!highlightBest)}
              className={`inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-[0.97] ${
                highlightBest
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/85"
                  : "border-border bg-card text-muted-foreground hover:border-input hover:text-foreground"
              }`}
            >
              <Target className="size-3.5" aria-hidden />
              Find a time
            </button>
          )}
        </div>
      </div>

      {bestTimes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 animate-in fade-in duration-300">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-brand" aria-hidden />
            {bestTimes[0].count >= total
              ? "Everyone's free"
              : "Most people free"}
          </span>
          {bestTimes.map((best) => (
            <Tooltip
              key={best.startMs}
              content={`${freeLabel(best.count, total)} · show on calendar`}
            >
              <button
                type="button"
                onClick={() => onBestTimeClick(best.startMs)}
                className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 text-xs font-medium transition-colors hover:bg-brand/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              >
                <span>{formatDayLabel(best.startMs)}</span>
                <span className="text-muted-foreground tabular-nums">
                  {formatTimeRange(best.startMs, best.endMs)}
                </span>
                {best.count < total && (
                  <span className="tabular-nums text-muted-foreground">
                    · {best.count}/{total}
                  </span>
                )}
              </button>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
}

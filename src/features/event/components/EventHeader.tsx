import type { ReactNode } from "react";
import { Clock, Globe, Crown, LogOut, MapPin, MoreHorizontal, Settings2, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { Tooltip } from "@/components/ui/Tooltip";
import { intervalLabel, type IntervalMinutes } from "@/lib/intervals";
import { browserTimezone, timezoneFullName, timezoneShortName } from "@/lib/time";
import { ShareLinkButton } from "./ShareLinkButton";

type EventHeaderProps = {
  publicId: string;
  eventName: string;
  participantName: string;
  intervalMinutes: IntervalMinutes;
  timezone: string | null;
  /** The calendar's hours in the viewer's timezone, e.g. "9 AM – 9 PM". */
  hoursLabel: string;
  /**
   * The event's own hours in its timezone, e.g. "8 AM – 9 PM ET". Null when the
   * viewer is in the event's timezone, so the local hours say it all.
   */
  eventHoursLabel: string | null;
  isOrganizer: boolean;
  onOpenSettings: () => void;
  onLeave: () => void;
  onDelete: () => void;
};

// Longest chip text (prefix included) shown in full; longer names fall back to the abbreviation.
const CHIP_TEXT_MAX = 28;

function timezoneChipText(tz: string, prefix = "") {
  const full = `${prefix}${timezoneFullName(tz)}`;
  return full.length <= CHIP_TEXT_MAX ? full : `${prefix}${timezoneShortName(tz)}`;
}

function MetaChip({ icon, children, tooltip }: { icon: ReactNode; children: ReactNode; tooltip: ReactNode }) {
  return (
    <Tooltip content={tooltip} touchTrigger="tap">
      <span
        tabIndex={0}
        className="inline-flex h-7 cursor-default items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="shrink-0" aria-hidden>
          {icon}
        </span>
        <span className="max-w-56 truncate">{children}</span>
      </span>
    </Tooltip>
  );
}

export function EventHeader({
  publicId,
  eventName,
  participantName,
  intervalMinutes,
  timezone,
  hoursLabel,
  eventHoursLabel,
  isOrganizer,
  onOpenSettings,
  onLeave,
  onDelete,
}: EventHeaderProps) {
  const viewerTimezone = browserTimezone();
  const items: MenuItem[] = isOrganizer
    ? [
        {
          label: "Event settings",
          description: "Timezone, hours, time slots",
          icon: <Settings2 className="size-4" />,
          onSelect: onOpenSettings,
        },
        {
          label: "Delete event",
          icon: <Trash2 className="size-4" />,
          destructive: true,
          onSelect: onDelete,
        },
      ]
    : [
        {
          label: "Leave event",
          description: "Removes your availability",
          icon: <LogOut className="size-4" />,
          destructive: true,
          onSelect: onLeave,
        },
      ];

  return (
    <header className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-balance break-words font-display text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-4xl">
          {eventName}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <MetaChip
            icon={isOrganizer ? <Crown className="size-3.5 text-brand" /> : <UserRound className="size-3.5" />}
            tooltip={isOrganizer ? "You organize this event" : "Your name in this event"}
          >
            {participantName}
            {isOrganizer && " · organizer"}
          </MetaChip>
          <MetaChip icon={<Clock className="size-3.5" />} tooltip="The smallest block of time you can pick">
            {intervalLabel(intervalMinutes)} slots
          </MetaChip>
          <MetaChip
            icon={<MapPin className="size-3.5" />}
            tooltip={`Times are shown in your timezone, ${timezoneFullName(viewerTimezone)}. The calendar runs ${hoursLabel}.`}
          >
            {timezoneChipText(viewerTimezone)}
          </MetaChip>
          {eventHoursLabel && (
            <MetaChip
              icon={<Globe className="size-3.5" />}
              tooltip={`This event is set in ${timezoneFullName(timezone ?? "UTC")}, ${eventHoursLabel}.`}
            >
              {timezoneChipText(timezone ?? "UTC", "Event in ")}
            </MetaChip>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ShareLinkButton publicId={publicId} />
        <Menu
          items={items}
          trigger={(triggerProps) => (
            <Tooltip content="More options">
              <Button {...triggerProps} variant="secondary" size="icon" aria-label="More options">
                <MoreHorizontal className="size-4" aria-hidden />
              </Button>
            </Tooltip>
          )}
        />
      </div>
    </header>
  );
}

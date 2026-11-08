import type { ReactNode } from "react";
import { Clock, Crown, Globe, LogOut, MoreHorizontal, Settings2, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { Tooltip } from "@/components/ui/Tooltip";
import { intervalLabel, type IntervalMinutes } from "@/lib/intervals";
import { ShareLinkButton } from "./ShareLinkButton";

type EventHeaderProps = {
  publicId: string;
  eventName: string;
  participantName: string;
  intervalMinutes: IntervalMinutes;
  timezone: string | null;
  isOrganizer: boolean;
  onOpenSettings: () => void;
  onLeave: () => void;
  onDelete: () => void;
};

function MetaChip({ icon, children, tooltip }: { icon: ReactNode; children: ReactNode; tooltip: string }) {
  return (
    <Tooltip content={tooltip}>
      <span
        tabIndex={0}
        className="inline-flex h-7 cursor-default items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="shrink-0" aria-hidden>
          {icon}
        </span>
        <span className="max-w-40 truncate">{children}</span>
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
  isOrganizer,
  onOpenSettings,
  onLeave,
  onDelete,
}: EventHeaderProps) {
  const items: MenuItem[] = isOrganizer
    ? [
        {
          label: "Event settings",
          description: "Slot length, timezone",
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
            tooltip={isOrganizer ? "You organize this event" : "The name others see for you"}
          >
            {participantName}
            {isOrganizer && " · organizer"}
          </MetaChip>
          <MetaChip
            icon={<Clock className="size-3.5" />}
            tooltip="Availability snaps to this slot length"
          >
            {intervalLabel(intervalMinutes)} slots
          </MetaChip>
          {timezone && (
            <MetaChip
              icon={<Globe className="size-3.5" />}
              tooltip="Fallback timezone when a viewer's own timezone isn't known"
            >
              {timezone.replace(/_/g, " ")}
            </MetaChip>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ShareLinkButton publicId={publicId} eventName={eventName} />
        <Menu
          items={items}
          trigger={(triggerProps) => (
            <Tooltip content="More options">
              <Button
                {...triggerProps}
                variant="secondary"
                size="icon"
                aria-label="More options"
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </Button>
            </Tooltip>
          )}
        />
      </div>
    </header>
  );
}

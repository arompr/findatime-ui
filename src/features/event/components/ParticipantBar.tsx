import { useState } from "react";
import { ErrorText } from "@/components/ui/ErrorText";

type ParticipantBarProps = {
  name: string;
  leaving: boolean;
  error?: string;
  onLeave: () => void;
};

export function ParticipantBar({ name, leaving, error, onLeave }: ParticipantBarProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-sm text-slate-500">
          Joined as <span className="font-medium text-slate-900">{name}</span>
        </p>
        {confirming ? (
          <span className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Leave this event?</span>
            <button
              type="button"
              disabled={leaving}
              onClick={onLeave}
              className="cursor-pointer font-medium text-red-600 underline-offset-2 hover:underline disabled:text-red-300"
            >
              {leaving ? "Leaving…" : "Leave"}
            </button>
            <button
              type="button"
              disabled={leaving}
              onClick={() => setConfirming(false)}
              className="cursor-pointer font-medium text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="cursor-pointer text-sm text-slate-400 underline-offset-2 hover:text-slate-700 hover:underline"
          >
            Leave event
          </button>
        )}
      </div>
      <ErrorText message={error} />
    </div>
  );
}

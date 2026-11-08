import { useEffect, useRef, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";

type ShareLinkButtonProps = {
  publicId: string;
  eventName: string;
};

/**
 * Opens the native share sheet on touch devices, otherwise copies the link to
 * the clipboard and confirms inline.
 */
export function ShareLinkButton({ publicId, eventName }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);
  const url = `${window.location.origin}/events/${publicId}`;

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link", url);
      return;
    }
    setCopied(true);
    navigator.vibrate?.(8);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    const canShare = "share" in navigator && window.matchMedia("(hover: none)").matches;
    if (canShare) {
      try {
        await navigator.share({ title: eventName, text: `When are you free for ${eventName}?`, url });
      } catch {
        // Dismissed share sheet — nothing to do.
      }
      return;
    }
    await copy();
  };

  return (
    <Tooltip content={copied ? "Copied!" : "Anyone with the link can join"}>
      <Button variant="primary" size="sm" onClick={() => void share()} aria-live="polite">
        <span className="relative inline-flex size-4">
          <Link2
            className={`absolute inset-0 size-4 transition-all duration-200 ${copied ? "scale-50 opacity-0" : "scale-100 opacity-100"}`}
            aria-hidden
          />
          <Check
            className={`absolute inset-0 size-4 transition-all duration-200 ${copied ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
            aria-hidden
          />
        </span>
        {copied ? "Link copied" : "Invite"}
      </Button>
    </Tooltip>
  );
}

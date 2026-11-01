import { useState } from "react";
import { Check, Share2 } from "lucide-react";

type ShareLinkButtonProps = {
  publicId: string;
};

/**
 * Opens the native share sheet where available (mobile), otherwise copies the
 * link to the clipboard.
 */
export function ShareLinkButton({ publicId }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/events/${publicId}`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Findatime", url });
      } catch {
        // Dismissed share sheet — nothing to do.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
    >
      {copied ? (
        <Check className="size-4 text-green-600" aria-hidden />
      ) : (
        <Share2 className="size-4" aria-hidden />
      )}
      {copied ? "Link copied" : "Share link"}
    </button>
  );
}

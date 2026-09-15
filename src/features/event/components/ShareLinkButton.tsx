import { CopyButton } from "@/features/home/components/ui/CopyButton";

type ShareLinkButtonProps = {
  publicId: string;
};

export function ShareLinkButton({ publicId }: ShareLinkButtonProps) {
  const url = `${window.location.origin}/events/${publicId}`;
  return <CopyButton value={url} label="Copy share link" />;
}

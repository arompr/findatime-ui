import type { ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";

type AiPolicyModalProps = {
  onClose: () => void;
};

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </a>
  );
}

export function AiPolicyModal({ onClose }: AiPolicyModalProps) {
  return (
    <Modal title="How I use AI" onClose={onClose}>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Findatime is a personal project, and AI tools helped accelerate its
          development. I used AI as a coding assistant, mostly for the website.
          I'm a terrible UX/UI designer, and I wanted Findatime to feel great to
          use (especially on mobile).
        </p>
        <p>
          Findatime is open source under the MIT license, so feel free to use it
          and change it however you like:{" "}
          <ExternalLink href="https://github.com/arompr/findatime-ui">
            website
          </ExternalLink>{" "}
          ·{" "}
          <ExternalLink href="https://github.com/arompr/findatime-api">
            api
          </ExternalLink>
        </p>
      </div>
    </Modal>
  );
}

import { useState, type ReactNode } from "react";
import { ArrowUpRight, Code, Github, Server, Sparkles, type LucideIcon } from "lucide-react";
import { Popover } from "@/components/ui/Popover";

type FooterCardProps = {
  label: string;
  icon: LucideIcon;
  title: string;
  children: ReactNode;
};

function FooterCard({ label, icon: Icon, title, children }: FooterCardProps) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        ref={setAnchor}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg px-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          open ? "text-foreground" : ""
        }`}
      >
        <Icon className="size-3.5" aria-hidden />
        <span className="underline decoration-border underline-offset-4">{label}</span>
      </button>
      <Popover
        open={open}
        anchor={anchor}
        onClose={() => setOpen(false)}
        side="top"
        align="center"
        className="w-[min(20rem,calc(100vw-2rem))] overflow-hidden"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        <div className="space-y-3 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
      </Popover>
    </>
  );
}

type RepoLinkProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  repo: string;
};

function RepoLink({ href, icon: Icon, label, repo }: RepoLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{repo}</span>
      </span>
      <ArrowUpRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
        aria-hidden
      />
    </a>
  );
}

export function FooterLinks() {
  return (
    <div className="flex items-center gap-1">
      <FooterCard label="AI Disclaimer" icon={Sparkles} title="AI Disclaimer">
        <p>
          Findatime is a personal project, and AI tools helped accelerate its
          development. I used AI as a coding assistant, mostly for the website.
          I'm a terrible UX/UI designer, and I wanted Findatime to feel great to
          use (especially on mobile).
        </p>
        <p>
          If that's a dealbreaker, feel free to use the OG that inspired this
          project:{" "}
          <a
            href="https://www.when2meet.com/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            When2meet
          </a>
          .
        </p>
      </FooterCard>
      <span aria-hidden className="text-border">
        ·
      </span>
      <FooterCard label="Open source" icon={Github} title="Open source">
        <p>
          Findatime is open source under the MIT license, so feel free to use it
          and change it however you like.
        </p>
        <div className="space-y-2">
          <RepoLink
            href="https://github.com/arompr/findatime-ui"
            icon={Code}
            label="UI"
            repo="arompr/findatime-ui"
          />
          <RepoLink
            href="https://github.com/arompr/findatime-api"
            icon={Server}
            label="API"
            repo="arompr/findatime-api"
          />
        </div>
      </FooterCard>
    </div>
  );
}

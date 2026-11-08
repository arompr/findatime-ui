import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  onClose: () => void;
};

/**
 * Rendered into document.body so no ancestor's stacking context, transform, or
 * overflow can trap it below page content (e.g. the calendar's z-30/z-50
 * layers). A bottom sheet below `sm`, a centered dialog above.
 */
export function Modal({ title, description, children, onClose }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) {
      panel.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#141413]/45 backdrop-blur-[2px] animate-in fade-in duration-200 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 text-card-foreground shadow-[var(--shadow-lift)] outline-none animate-in slide-in-from-bottom-8 duration-300 ease-out sm:max-w-md sm:rounded-2xl sm:p-6 sm:zoom-in-95 sm:slide-in-from-bottom-2 sm:duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          aria-hidden
          className="mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-border sm:hidden"
        />
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-mr-2 -mt-1 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

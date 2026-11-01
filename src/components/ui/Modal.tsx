import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
};

/**
 * Rendered into document.body so no ancestor's stacking context, transform, or
 * overflow can trap it below page content (e.g. the calendar's z-30/z-50
 * layers).
 */
export function Modal({ title, children, onClose }: ModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}

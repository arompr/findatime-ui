import type { ReactNode } from "react";
import { Button } from "./Button";
import { ErrorText } from "./ErrorText";
import { Modal } from "./Modal";

type ConfirmDialogProps = {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  loading: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  destructive = false,
  loading,
  error,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancel = () => {
    if (!loading) onCancel();
  };

  return (
    <Modal title={title} onClose={cancel}>
      <div className="flex flex-col gap-5">
        <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
        <ErrorText message={error} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" disabled={loading} onClick={cancel}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorText } from "@/components/ui/ErrorText";
import { Modal } from "@/components/ui/Modal";

type DeleteEventButtonProps = {
  eventName: string;
  loading: boolean;
  error?: string;
  onOpen: () => void;
  onConfirm: () => void;
};

export function DeleteEventButton({
  eventName,
  loading,
  error,
  onOpen,
  onConfirm,
}: DeleteEventButtonProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Delete event"
        title="Delete event"
        onClick={() => {
          onOpen();
          setConfirming(true);
        }}
        className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>

      {confirming && (
        <Modal
          title="Delete event"
          onClose={() => {
            if (!loading) setConfirming(false);
          }}
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              Delete <span className="font-medium text-slate-900">{eventName}</span> and
              everyone's availability? This can't be undone.
            </p>

            <ErrorText message={error} />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={loading}
                onClick={onConfirm}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

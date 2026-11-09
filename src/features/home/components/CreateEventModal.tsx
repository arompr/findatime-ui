import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Field } from "@/components/ui/Field";
import { ErrorText } from "@/components/ui/ErrorText";
import { Modal } from "@/components/ui/Modal";

type CreateEventModalProps = {
  loading: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (name: string, organizerName: string) => void;
};

export function CreateEventModal({
  loading,
  error,
  onClose,
  onSubmit,
}: CreateEventModalProps) {
  const [name, setName] = useState("");
  const [organizerName, setOrganizerName] = useState("");

  return (
    <Modal
      title="New event"
      description="You'll get a link to share once it's created."
      onClose={onClose}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && organizerName.trim()) {
            onSubmit(name.trim(), organizerName.trim());
          }
        }}
      >
        <Field label="What's it for?">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Team sprint planning"
            autoFocus
          />
        </Field>
        <Field label="Your name" hint="Shown to everyone as the organizer.">
          <TextInput
            value={organizerName}
            onChange={(e) => setOrganizerName(e.target.value)}
            placeholder="e.g. Alex"
            autoComplete="given-name"
          />
        </Field>
        <ErrorText message={error} />
        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!name.trim() || !organizerName.trim()}
          >
            Create event
          </Button>
        </div>
      </form>
    </Modal>
  );
}

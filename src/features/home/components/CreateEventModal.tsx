import { useState } from "react";
import { Button } from "./ui/Button";
import { TextInput } from "./ui/TextInput";
import { Field } from "./ui/Field";
import { ErrorText } from "./ui/ErrorText";
import { Modal } from "./ui/Modal";

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
    <Modal title="Create an event" onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && organizerName.trim()) {
            onSubmit(name.trim(), organizerName.trim());
          }
        }}
      >
        <Field label="Event name">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Team sprint planning"
            autoFocus
          />
        </Field>
        <Field label="Your name">
          <TextInput
            value={organizerName}
            onChange={(e) => setOrganizerName(e.target.value)}
            placeholder="e.g. Alex"
          />
        </Field>
        {error && <ErrorText message={error} />}
        <Button type="submit" loading={loading} disabled={!name.trim() || !organizerName.trim()}>
          Create event
        </Button>
      </form>
    </Modal>
  );
}

import dayjs from "dayjs";
import type { AvailabilitySelectionInput } from "@/lib/availability";

export type OtherAvailability = {
  id: string;
  name: string;
  ranges: AvailabilitySelectionInput[];
};

function range(
  dayOffset: number,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
): AvailabilitySelectionInput {
  const base = dayjs().startOf("day").add(dayOffset, "day");
  return {
    startUtc: base.add(startHour, "hour").add(startMinute, "minute").toISOString(),
    endUtc: base.add(endHour, "hour").add(endMinute, "minute").toISOString(),
  };
}

export function getOtherAvailability(): OtherAvailability[] {
  return [
    {
      id: "other-anna",
      name: "Anna",
      ranges: [
        range(0, 9, 0, 11, 0),
        range(1, 13, 0, 15, 0),
      ],
    },
    {
      id: "other-ben",
      name: "Ben",
      ranges: [
        range(0, 10, 0, 12, 0),
        range(1, 14, 0, 16, 0),
      ],
    },
    {
      id: "other-cara",
      name: "Cara",
      ranges: [
        range(0, 10, 30, 11, 30),
      ],
    },
  ];
}

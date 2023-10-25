import { Either } from "../types";

type Frequency =
  | "SECONDLY"
  | "MINUTELY"
  | "HOURLY"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "YEARLY";
type Weekday = "SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA";

export type RecurrenceRule = {
  freq: Frequency;
  interval?: number;
  bySecond?: number[];
  byMinute?: number[];
  byHour?: number[];
  byDay?: never;
  byMonthDay?: never;
  byYearDay?: never;
  byWeekNo?: never;
  byMonth?: never;
  weekStart?: Weekday;
} & Partial<
  Either<
    {
      until: Date;
    },
    {
      count: number;
    }
  >
>;
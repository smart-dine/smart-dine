import type { OpeningHours } from './api/contracts';

type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

type OpeningHoursEntry = {
  opens?: string | null;
  closes?: string | null;
  isClosed?: boolean | null;
};

const orderedDays: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const dayLabels: Record<DayKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const dayKeyByJsDay: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const toOpeningHoursRecord = (
  openingHours: OpeningHours | null | undefined,
): Partial<Record<DayKey, OpeningHoursEntry>> => {
  if (!openingHours || typeof openingHours !== 'object') {
    return {};
  }

  return openingHours as Partial<Record<DayKey, OpeningHoursEntry>>;
};

const formatOpeningHoursEntry = (entry: OpeningHoursEntry | undefined): string => {
  if (!entry) {
    return 'Unavailable';
  }

  if (entry.isClosed) {
    return 'Closed';
  }

  if (entry.opens && entry.closes) {
    return `${entry.opens} - ${entry.closes}`;
  }

  return 'Unavailable';
};

export const getOpeningHoursRows = (openingHours: OpeningHours | null | undefined) => {
  const hours = toOpeningHoursRecord(openingHours);

  return orderedDays.map((day) => {
    const entry = hours[day];

    return {
      day,
      label: dayLabels[day],
      value: formatOpeningHoursEntry(entry),
      isClosed: Boolean(entry?.isClosed),
    };
  });
};

export const getTodayOpeningHoursLabel = (openingHours: OpeningHours | null | undefined) => {
  const hours = toOpeningHoursRecord(openingHours);
  const today = dayKeyByJsDay[new Date().getDay()];
  const entry = hours[today];

  if (!entry) {
    return 'Hours unavailable today';
  }

  if (entry.isClosed) {
    return 'Closed today';
  }

  if (entry.opens && entry.closes) {
    return `Open today ${entry.opens} - ${entry.closes}`;
  }

  return 'Hours unavailable today';
};

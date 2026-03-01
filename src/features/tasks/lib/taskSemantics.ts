export type Priority = 'high' | 'normal' | 'low';

export function extractPriorityFromContent(content: string): Priority {
  const lower = content.toLowerCase();
  if (lower.includes('#high') || lower.includes('#p1') || /\bp1\b/.test(lower)) {
    return 'high';
  }
  if (lower.includes('#low')) {
    return 'low';
  }
  return 'normal';
}

export function extractTaggedPriorityFromContent(content: string): Priority | undefined {
  const lower = content.toLowerCase();
  if (/(?:^|\s)#high\b/.test(lower) || /(?:^|\s)#p1\b/.test(lower) || /\bp1\b/.test(lower)) {
    return 'high';
  }
  if (/(?:^|\s)#normal\b/.test(lower)) {
    return 'normal';
  }
  if (/(?:^|\s)#low\b/.test(lower)) {
    return 'low';
  }
  return undefined;
}

export function extractTimeFromContent(content: string): string | undefined {
  const match = content.match(/\b(?:@|at\s+)?([1-9]|1[0-2])(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (!match) {
    return undefined;
  }

  const rawHour = Number(match[1]);
  const minutes = match[2] ?? '00';
  const meridiem = match[3].toLowerCase();

  let hour24 = rawHour % 12;
  if (meridiem === 'pm') {
    hour24 += 12;
  }

  return `${hour24.toString().padStart(2, '0')}:${minutes}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function extractDateFromContent(content: string, now = new Date()): string | undefined {
  const lower = content.toLowerCase();
  const today = startOfDay(now);

  if (/\btoday\b/.test(lower)) {
    return toIsoDate(today);
  }

  if (/\btomorrow\b/.test(lower)) {
    return toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
  }

  const weekdayMatch = lower.match(
    /\b(mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/,
  );
  if (weekdayMatch) {
    const dayMap: Record<string, number> = {
      sun: 0,
      sunday: 0,
      mon: 1,
      monday: 1,
      tue: 2,
      tues: 2,
      tuesday: 2,
      wed: 3,
      wednesday: 3,
      thu: 4,
      thurs: 4,
      thursday: 4,
      fri: 5,
      friday: 5,
      sat: 6,
      saturday: 6,
    };
    const targetDay = dayMap[weekdayMatch[1]];
    if (targetDay !== undefined) {
      const currentDay = today.getDay();
      const delta = (targetDay - currentDay + 7) % 7;
      return toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + delta));
    }
  }

  const dateMatch = lower.match(
    /\b(0?[1-9]|1[0-2])[\/-](0?[1-9]|[12]\d|3[01])(?:[\/-](\d{2,4}))?\b/,
  );
  if (!dateMatch) {
    return undefined;
  }

  const month = Number(dateMatch[1]) - 1;
  const day = Number(dateMatch[2]);
  const yearText = dateMatch[3];
  const year = yearText
    ? yearText.length === 2
      ? 2000 + Number(yearText)
      : Number(yearText)
    : today.getFullYear();

  return toIsoDate(new Date(year, month, day));
}

export function parseTaskSemantics(content: string, defaultPriority: Priority = 'normal', now = new Date()) {
  const taggedPriority = extractTaggedPriorityFromContent(content);
  return {
    priority: taggedPriority ?? defaultPriority,
    taggedPriority,
    scheduledTime: extractTimeFromContent(content),
    scheduledFor: extractDateFromContent(content, now),
  };
}

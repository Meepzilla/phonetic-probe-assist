import type { ProbeSession } from './types';

/**
 * Student age resolution.
 *
 * A session may carry the student's age in either of two optional
 * forms (see ProbeSession): a birthdate, or an age in completed
 * months entered directly as years;months. The birthdate wins when
 * both are present. The age is always expressed in completed months:
 * a child counts a new month on the day-of-month of their birth, so
 * a child born on the 15th is still one month short on the 14th.
 */

interface DateParts {
  year: number;
  /** 1 to 12. */
  month: number;
  /** 1 to 31. */
  day: number;
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses a strict yyyy-mm-dd calendar date, or returns null. */
function parseISODateParts(value: string): DateParts | null {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

/**
 * Completed months from a birthdate (yyyy-mm-dd) to a reference date
 * (yyyy-mm-dd, or an ISO timestamp whose calendar date is used).
 * Returns null when either date is invalid or the birthdate falls
 * after the reference date.
 */
export function completedMonthsFromBirthdate(
  birthdate: string,
  referenceDate: string
): number | null {
  const birth = parseISODateParts(birthdate);
  const reference = parseISODateParts(referenceDate.slice(0, 10));
  if (!birth || !reference) return null;
  let months = (reference.year - birth.year) * 12 + (reference.month - birth.month);
  if (reference.day < birth.day) months -= 1;
  return months < 0 ? null : months;
}

/**
 * The student's age in completed months at the session date, or null
 * when the session carries no usable age. A stored birthdate wins
 * over a directly entered age; a birthdate string that does not parse
 * falls through to the entered age rather than failing the session.
 */
export function resolveStudentAgeMonths(session: ProbeSession): number | null {
  if (typeof session.studentBirthdate === 'string') {
    const fromBirthdate = completedMonthsFromBirthdate(session.studentBirthdate, session.date);
    if (fromBirthdate !== null) return fromBirthdate;
  }
  if (
    typeof session.studentAgeMonths === 'number' &&
    Number.isFinite(session.studentAgeMonths) &&
    session.studentAgeMonths >= 0
  ) {
    return Math.floor(session.studentAgeMonths);
  }
  return null;
}

/** Renders completed months in clinical years;months form (55 renders "4;7"). */
export function formatAgeMonths(totalMonths: number): string {
  const months = Math.max(0, Math.floor(totalMonths));
  return `${Math.floor(months / 12)};${months % 12}`;
}

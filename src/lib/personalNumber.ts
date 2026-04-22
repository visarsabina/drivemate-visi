// Validation and parsing utilities for the Kosovo personal number (Numri Personal)
// Format: 10 digits — DDMMYYY + 3-digit serial
//   - Digits 1-2: day of birth (DD)
//   - Digits 3-4: month of birth (MM)
//   - Digits 5-7: last 3 digits of birth year (YYY)
//   - Digits 8-10: serial number
// The century (19xx vs 20xx) is inferred so the resulting date is not in the future.

export interface PersonalNumberInfo {
  valid: boolean;
  /** ISO date string (yyyy-mm-dd) when valid */
  birthDate?: string;
  error?: string;
}

const isValidCalendarDate = (year: number, month: number, day: number): boolean => {
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
};

export const parsePersonalNumber = (value: string): PersonalNumberInfo => {
  const digits = (value || "").replace(/\D/g, "");

  if (digits.length === 0) {
    return { valid: false, error: "Numri personal është bosh" };
  }
  if (digits.length !== 10) {
    return { valid: false, error: "Numri personal duhet të ketë saktësisht 10 shifra" };
  }

  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const yearSuffix = parseInt(digits.slice(4, 7), 10);

  if (month < 1 || month > 12) {
    return { valid: false, error: "Muaji në numrin personal nuk është i vlefshëm" };
  }
  if (day < 1 || day > 31) {
    return { valid: false, error: "Dita në numrin personal nuk është e vlefshme" };
  }

  // Infer century: try 1900 + yearSuffix and 2000 + yearSuffix; pick the most plausible (not in future, age <= 120)
  const today = new Date();
  const candidates = [1000 + yearSuffix, 2000 + yearSuffix];
  let chosenYear: number | null = null;

  for (const year of candidates) {
    if (!isValidCalendarDate(year, month, day)) continue;
    const candidateDate = new Date(year, month - 1, day);
    if (candidateDate > today) continue;
    const ageYears = (today.getTime() - candidateDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (ageYears > 120) continue;
    // Prefer the most recent plausible year (so e.g. 005 → 2005, not 1905)
    if (chosenYear === null || year > chosenYear) {
      chosenYear = year;
    }
  }

  if (chosenYear === null) {
    return { valid: false, error: "Data e lindjes nga numri personal nuk është e vlefshme" };
  }

  const iso = `${chosenYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { valid: true, birthDate: iso };
};

export const isValidPersonalNumber = (value: string): boolean => parsePersonalNumber(value).valid;

// Validation utilities for the Kosovo personal number (Numri Personal)
// Per Administrative Instruction (MIA) No. 06/2016 of the Republic of Kosovo,
// the personal number is unique, composed of exactly 10 digits, and is encoded.
// The encoding is NOT a public/derivable scheme (it does not contain the birth
// date in plain digits like the former JMBG), so we only validate the length
// and that the value is fully numeric.

export interface PersonalNumberInfo {
  valid: boolean;
  error?: string;
}

export const parsePersonalNumber = (value: string): PersonalNumberInfo => {
  const digits = (value || "").replace(/\D/g, "");

  if (digits.length === 0) {
    return { valid: false, error: "Numri personal është bosh" };
  }
  if (digits.length !== 10) {
    return { valid: false, error: "Numri personal duhet të ketë saktësisht 10 shifra" };
  }
  if (!/^\d{10}$/.test(digits)) {
    return { valid: false, error: "Numri personal duhet të përmbajë vetëm shifra" };
  }
  return { valid: true };
};

export const isValidPersonalNumber = (value: string): boolean => parsePersonalNumber(value).valid;

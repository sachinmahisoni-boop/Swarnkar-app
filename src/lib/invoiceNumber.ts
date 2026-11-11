/**
 * Sequential Invoice Numbering & IST Date Helper
 * Format: SMJ/2026-27/0001 (Max 16 chars as per GST Rules)
 */

export interface FinancialYearInfo {
  finYearStr: string; // e.g., "2026-27"
  startYear: number;  // 2026
  endYear: number;    // 2027
}

/**
 * Returns Indian Standard Time (IST) Date parts
 */
export function getISTDate(dateInput: Date = new Date()): {
  isoDateStr: string; // "YYYY-MM-DD"
  formattedDateStr: string; // "DD-MM-YYYY"
  timestampMs: number;
  financialYear: FinancialYearInfo;
} {
  // Convert to Indian Standard Time (UTC + 5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const utcMs = dateInput.getTime() + (dateInput.getTimezoneOffset() * 60000);
  const istDate = new Date(utcMs + istOffset);

  const year = istDate.getFullYear();
  const month = istDate.getMonth() + 1; // 1 - 12
  const day = istDate.getDate();

  const mm = month < 10 ? `0${month}` : `${month}`;
  const dd = day < 10 ? `0${day}` : `${day}`;

  const isoDateStr = `${year}-${mm}-${dd}`;
  const formattedDateStr = `${dd}-${mm}-${year}`;

  // Calculate Financial Year (April 1 to March 31)
  let startYear = year;
  if (month < 4) {
    startYear = year - 1;
  }
  const endYear = startYear + 1;
  const shortEnd = `${endYear}`.substring(2);
  const finYearStr = `${startYear}-${shortEnd}`; // "2026-27"

  return {
    isoDateStr,
    formattedDateStr,
    timestampMs: istDate.getTime(),
    financialYear: {
      finYearStr,
      startYear,
      endYear
    }
  };
}

/**
 * Formats sequential invoice number compliant with Rule 46(b) of CGST Rules
 * Max 16 characters: e.g. SMJ/2026-27/0001 or EST/2026-27/0001
 */
export function formatSequentialNumber(
  prefix: string, // "SMJ" or "EST" or "PUR" or "GRV" or "CN"
  finYearStr: string, // "2026-27"
  sequenceNo: number,
  paddingLength: number = 4
): string {
  const seqPadded = `${sequenceNo}`.padStart(paddingLength, '0');
  return `${prefix}/${finYearStr}/${seqPadded}`;
}

/**
 * Parses financial year string from invoice number or returns current FY
 */
export function getCurrentFinancialYearStr(date: Date = new Date()): string {
  return getISTDate(date).financialYear.finYearStr;
}

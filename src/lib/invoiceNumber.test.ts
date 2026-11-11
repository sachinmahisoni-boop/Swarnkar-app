import { describe, it, expect } from 'vitest';
import { getISTDate, formatSequentialNumber } from './invoiceNumber';

describe('Invoice Numbering & IST Date', () => {
  it('formats financial year and sequential invoice number correctly', () => {
    // FY 2026-27 for May 2026
    const testDate = new Date('2026-05-15T10:00:00Z');
    const istInfo = getISTDate(testDate);
    expect(istInfo.financialYear.finYearStr).toBe('2026-27');

    const formattedNo = formatSequentialNumber('SMJ', istInfo.financialYear.finYearStr, 42, 4);
    expect(formattedNo).toBe('SMJ/2026-27/0042');
    expect(formattedNo.length).toBeLessThanOrEqual(16);
  });

  it('calculates financial year 2026-27 for Jan 2027', () => {
    const testDate = new Date('2027-01-15T10:00:00Z');
    const istInfo = getISTDate(testDate);
    expect(istInfo.financialYear.finYearStr).toBe('2026-27');
  });

  it('calculates financial year 2027-28 for April 2027', () => {
    const testDate = new Date('2027-04-01T04:00:00Z');
    const istInfo = getISTDate(testDate);
    expect(istInfo.financialYear.finYearStr).toBe('2027-28');
  });
});

/**
 * Pricing and Tax Calculations for Jewellery ERP
 * All money values are calculated and rounded to 2 decimal places (paise precision).
 */

import { MetalType, InvoiceItem, OldMetalExchange } from '../types';

export interface CalculatedItemSubtotal {
  metalCost: number;
  wastageCost: number;
  makingCharge: number;
  stoneValue: number;
  huidCharge: number;
  grossSubtotal: number; // before discount
  discountAllocated: number; // item discount + proportional bill discount
  taxableValue: number; // grossSubtotal - discountAllocated
  hsnCode: string;
  gstRate: number; // e.g. 3.0 or 5.0
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalWithTax: number;
  estimatedCostPrice?: number;
  isCostEstimated: boolean;
}

/**
 * Standard HSN mapping for Jewellery
 * TODO(CA): Confirm default HSN codes and GST rates with Chartered Accountant.
 */
export function getHsnAndGstRate(metal: MetalType, category?: string): { hsnCode: string; gstRate: number } {
  if (metal === 'Artificial') {
    // TODO(CA): Imitation jewellery HSN 7117 - Default GST rate 3%
    return { hsnCode: '7117', gstRate: 3.0 };
  }
  if (metal === 'Silver') {
    // HSN 7113 for Silver Jewellery (7106 is for unwrought/raw silver bullion)
    return { hsnCode: '7113', gstRate: 3.0 };
  }
  if (metal === 'Diamond' || metal === 'Gemstone') {
    return { hsnCode: '7113', gstRate: 3.0 };
  }
  // Gold, Platinum, etc.
  return { hsnCode: '7113', gstRate: 3.0 };
}

/**
 * Calculate making charge for an item
 */
export function calculateMakingCharge(
  netWeight: number,
  metalRate: number,
  type: 'per_gram' | 'flat' | 'percentage',
  rate: number,
  qty: number = 1
): number {
  let singleMaking = 0;
  if (type === 'per_gram') {
    singleMaking = netWeight * rate;
  } else if (type === 'percentage') {
    singleMaking = (netWeight * metalRate * rate) / 100;
  } else {
    // flat
    singleMaking = rate;
  }
  return roundPaise(singleMaking * qty);
}

/**
 * Calculate wastage cost
 */
export function calculateWastageCost(
  netWeight: number,
  wastagePercentage: number,
  metalRate: number,
  qty: number = 1
): number {
  if (!wastagePercentage || wastagePercentage <= 0) return 0;
  const wastageGrams = netWeight * (wastagePercentage / 100);
  return roundPaise(wastageGrams * metalRate * qty);
}

/**
 * Helper to round to 2 decimal places consistently (integer paise precision)
 */
export function roundPaise(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate item gross subtotal before tax and discount
 */
export function calculateItemSubtotal(
  netWeight: number,
  metalRateApplied: number,
  wastagePercent: number,
  makingType: 'per_gram' | 'flat' | 'percentage',
  makingRate: number,
  stoneValue: number = 0,
  huidFee: number = 0,
  qty: number = 1
): {
  metalCost: number;
  wastageCost: number;
  makingCharge: number;
  stoneValue: number;
  huidCharge: number;
  subtotal: number;
} {
  const metalCost = roundPaise(netWeight * metalRateApplied * qty);
  const wastageCost = calculateWastageCost(netWeight, wastagePercent, metalRateApplied, qty);
  const makingCharge = calculateMakingCharge(netWeight, metalRateApplied, makingType, makingRate, qty);
  const totalStone = roundPaise((stoneValue || 0) * qty);
  const totalHuid = roundPaise((huidFee || 0) * qty);

  const subtotal = roundPaise(metalCost + wastageCost + makingCharge + totalStone + totalHuid);

  return {
    metalCost,
    wastageCost,
    makingCharge,
    stoneValue: totalStone,
    huidCharge: totalHuid,
    subtotal
  };
}

/**
 * Proportionally allocates bill-level discount across items so HSN-wise taxable value is correct
 */
export function allocateBillDiscount(
  items: { grossSubtotal: number; itemDiscount: number }[],
  totalBillDiscount: number
): number[] {
  const totalGrossAfterItemDiscount = items.reduce((sum, item) => sum + Math.max(0, item.grossSubtotal - item.itemDiscount), 0);

  if (totalGrossAfterItemDiscount <= 0 || totalBillDiscount <= 0) {
    return items.map(i => i.itemDiscount);
  }

  let allocatedSum = 0;
  return items.map((item, index) => {
    const itemNetBeforeBillDiscount = Math.max(0, item.grossSubtotal - item.itemDiscount);
    if (index === items.length - 1) {
      // Last item gets remainder to eliminate rounding discrepancy
      const remainderBillDiscount = roundPaise(totalBillDiscount - (allocatedSum - items.slice(0, index).reduce((s, i) => s + i.itemDiscount, 0)));
      return roundPaise(item.itemDiscount + remainderBillDiscount);
    }
    const propBillDiscount = roundPaise((itemNetBeforeBillDiscount / totalGrossAfterItemDiscount) * totalBillDiscount);
    allocatedSum += propBillDiscount;
    return roundPaise(item.itemDiscount + propBillDiscount);
  });
}

/**
 * Calculates total old metal exchange value
 */
export function calculateOldMetalValue(oldMetal?: OldMetalExchange): number {
  if (!oldMetal) return 0;

  if (oldMetal.mode === 'lump_sum' && oldMetal.lumpSumAmount) {
    return roundPaise(oldMetal.lumpSumAmount);
  }

  // Weight * (Purity% - MeltLoss%) * Rate
  const gross = oldMetal.grossWeight || 0;
  const meltLoss = oldMetal.dustWastageGram || 0;
  const purityPct = (oldMetal.meltPurityPercent || 100) / 100;
  const effectiveNet = Math.max(0, (gross - meltLoss) * purityPct);

  return roundPaise(effectiveNet * (oldMetal.ratePerGram || 0));
}

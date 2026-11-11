import { describe, it, expect } from 'vitest';
import {
  calculateMakingCharge,
  calculateWastageCost,
  calculateItemSubtotal,
  allocateBillDiscount,
  calculateOldMetalValue,
  getHsnAndGstRate,
  roundPaise
} from './pricing';

describe('Pricing & Tax Calculations', () => {
  it('calculates gold 22K 10g making charge per gram correctly', () => {
    const making = calculateMakingCharge(10, 7500, 'per_gram', 450, 1);
    expect(making).toBe(4500);
  });

  it('calculates gold 22K 10g making charge flat rate correctly', () => {
    const making = calculateMakingCharge(10, 7500, 'flat', 2500, 1);
    expect(making).toBe(2500);
  });

  it('calculates gold 22K 10g making charge percentage correctly', () => {
    const making = calculateMakingCharge(10, 7500, 'percentage', 8, 1);
    // (10 * 7500 * 8) / 100 = 6000
    expect(making).toBe(6000);
  });

  it('calculates wastage cost for 5% wastage on 10g Gold @ ₹7500/g', () => {
    const wastage = calculateWastageCost(10, 5, 7500, 1);
    // 10 * 0.05 * 7500 = 3750
    expect(wastage).toBe(3750);
  });

  it('calculates item subtotal including metal, wastage, making, stone, HUID', () => {
    const result = calculateItemSubtotal(
      10, // netWeight
      7500, // metalRate
      2, // wastage %
      'per_gram', // makingType
      400, // makingRate
      1500, // stoneValue
      45, // huidFee
      1 // qty
    );

    // metalCost = 10 * 7500 = 75000
    // wastageCost = 10 * 0.02 * 7500 = 1500
    // makingCharge = 10 * 400 = 4000
    // stoneValue = 1500
    // huidCharge = 45
    // subtotal = 75000 + 1500 + 4000 + 1500 + 45 = 82045
    expect(result.metalCost).toBe(75000);
    expect(result.wastageCost).toBe(1500);
    expect(result.makingCharge).toBe(4000);
    expect(result.stoneValue).toBe(1500);
    expect(result.huidCharge).toBe(45);
    expect(result.subtotal).toBe(82045);
  });

  it('allocates bill-level discount proportionally across items', () => {
    const items = [
      { grossSubtotal: 10000, itemDiscount: 0 },
      { grossSubtotal: 30000, itemDiscount: 0 }
    ];
    const allocated = allocateBillDiscount(items, 2000);
    // Item 1 (25% of total): ₹500
    // Item 2 (75% of total): ₹1500
    expect(allocated[0]).toBe(500);
    expect(allocated[1]).toBe(1500);
    expect(allocated[0] + allocated[1]).toBe(2000);
  });

  it('calculates old metal exchange credit value', () => {
    const oldMetalVal = calculateOldMetalValue({
      mode: 'weight_rate',
      metal: 'Gold',
      purity: '22K',
      grossWeight: 10,
      dustWastageGram: 0.5, // 9.5g
      meltPurityPercent: 91.6, // 8.702g
      netWeight: 9.5,
      ratePerGram: 7000,
      totalCreditAmount: 0
    });
    // (10 - 0.5) * 0.916 * 7000 = 60914
    expect(oldMetalVal).toBe(60914);
  });

  it('returns correct HSN code 7113 for Gold/Silver jewellery and 7117 for Artificial', () => {
    expect(getHsnAndGstRate('Gold').hsnCode).toBe('7113');
    expect(getHsnAndGstRate('Silver').hsnCode).toBe('7113');
    expect(getHsnAndGstRate('Artificial').hsnCode).toBe('7117');
  });
});

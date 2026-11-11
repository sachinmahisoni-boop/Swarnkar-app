import { describe, it, expect } from 'vitest';
import { checkStockAvailability, deductStockItems, restoreStockItems } from './stock';
import { JewelleryItem, InvoiceItem } from '../types';

describe('Stock Management Utilities', () => {
  const mockInventory: JewelleryItem[] = [
    {
      id: 'item-1',
      tagNo: 'SMJ-001',
      name: 'Gold Ring 22K',
      category: 'Rings',
      metal: 'Gold',
      purity: '22K',
      grossWeight: 5,
      netWeight: 5,
      stoneWeight: 0,
      stoneValue: 0,
      wastagePercentage: 0,
      makingChargeType: 'flat',
      makingChargeRate: 1000,
      hsnCode: '7113',
      quantity: 5,
      minStockAlert: 1,
      barcode: 'SMJ-001'
    }
  ];

  it('checks stock availability correctly', () => {
    const cartItemsPass: InvoiceItem[] = [
      {
        itemId: 'item-1',
        tagNo: 'SMJ-001',
        name: 'Gold Ring 22K',
        category: 'Rings',
        metal: 'Gold',
        purity: '22K',
        grossWeight: 5,
        netWeight: 5,
        stoneWeight: 0,
        stoneValue: 0,
        metalRateApplied: 7500,
        metalCost: 37500,
        wastagePercentage: 0,
        wastageCost: 0,
        makingChargeType: 'flat',
        makingChargeRate: 1000,
        makingCharge: 1000,
        subtotal: 38500,
        hsnCode: '7113',
        quantity: 3
      }
    ];

    const checkPass = checkStockAvailability(cartItemsPass, mockInventory);
    expect(checkPass.canFulfill).toBe(true);

    const cartItemsFail: InvoiceItem[] = [
      { ...cartItemsPass[0], quantity: 10 }
    ];

    const checkFail = checkStockAvailability(cartItemsFail, mockInventory);
    expect(checkFail.canFulfill).toBe(false);
    expect(checkFail.issues.length).toBe(1);
  });

  it('deducts stock items by actual quantity sold', () => {
    const cartItems: InvoiceItem[] = [
      {
        itemId: 'item-1',
        tagNo: 'SMJ-001',
        name: 'Gold Ring 22K',
        category: 'Rings',
        metal: 'Gold',
        purity: '22K',
        grossWeight: 5,
        netWeight: 5,
        stoneWeight: 0,
        stoneValue: 0,
        metalRateApplied: 7500,
        metalCost: 37500,
        wastagePercentage: 0,
        wastageCost: 0,
        makingChargeType: 'flat',
        makingChargeRate: 1000,
        makingCharge: 1000,
        subtotal: 38500,
        hsnCode: '7113',
        quantity: 3
      }
    ];

    const updated = deductStockItems(mockInventory, cartItems);
    expect(updated[0].quantity).toBe(2); // 5 - 3
  });

  it('restores stock items when invoice is cancelled', () => {
    const cartItems: InvoiceItem[] = [
      {
        itemId: 'item-1',
        tagNo: 'SMJ-001',
        name: 'Gold Ring 22K',
        category: 'Rings',
        metal: 'Gold',
        purity: '22K',
        grossWeight: 5,
        netWeight: 5,
        stoneWeight: 0,
        stoneValue: 0,
        metalRateApplied: 7500,
        metalCost: 37500,
        wastagePercentage: 0,
        wastageCost: 0,
        makingChargeType: 'flat',
        makingChargeRate: 1000,
        makingCharge: 1000,
        subtotal: 38500,
        hsnCode: '7113',
        quantity: 3
      }
    ];

    const restored = restoreStockItems(mockInventory, cartItems);
    expect(restored[0].quantity).toBe(8); // 5 + 3
  });
});

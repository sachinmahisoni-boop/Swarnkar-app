/**
 * Stock Management & Inventory Validation Utilities
 */

import { JewelleryItem, InvoiceItem } from '../types';

export interface StockCheckResult {
  isAvailable: boolean;
  itemId?: string;
  itemName: string;
  requestedQty: number;
  availableQty: number;
  error?: string;
}

/**
 * Validates whether sufficient stock is available for all cart items
 */
export function checkStockAvailability(
  cartItems: InvoiceItem[],
  inventory: JewelleryItem[]
): { canFulfill: boolean; issues: StockCheckResult[] } {
  const issues: StockCheckResult[] = [];
  let canFulfill = true;

  for (const cartItem of cartItems) {
    if (!cartItem.itemId) continue; // Unlinked custom items skip inventory check

    const stockItem = inventory.find(i => i.id === cartItem.itemId);
    const available = stockItem ? stockItem.quantity : 0;
    const requested = cartItem.quantity || 1;

    if (!stockItem || available < requested) {
      canFulfill = false;
      issues.push({
        isAvailable: false,
        itemId: cartItem.itemId,
        itemName: cartItem.name,
        requestedQty: requested,
        availableQty: available,
        error: `स्टॉक में पर्याप्त मात्रा उपलब्ध नहीं है। उपलब्ध: ${available}, मांगी गई: ${requested}`
      });
    }
  }

  return { canFulfill, issues };
}

/**
 * Deducts cart quantities from inventory items
 */
export function deductStockItems(
  inventory: JewelleryItem[],
  cartItems: InvoiceItem[]
): JewelleryItem[] {
  return inventory.map(item => {
    const matchedCartItem = cartItems.find(c => c.itemId === item.id);
    if (matchedCartItem) {
      const deductQty = matchedCartItem.quantity || 1;
      const newQty = Math.max(0, item.quantity - deductQty);
      return {
        ...item,
        quantity: newQty
      };
    }
    return item;
  });
}

/**
 * Restores stock quantities when an invoice or item is cancelled/returned
 */
export function restoreStockItems(
  inventory: JewelleryItem[],
  cartItems: InvoiceItem[]
): JewelleryItem[] {
  return inventory.map(item => {
    const matchedCartItem = cartItems.find(c => c.itemId === item.id);
    if (matchedCartItem) {
      const restoreQty = matchedCartItem.quantity || 1;
      return {
        ...item,
        quantity: item.quantity + restoreQty
      };
    }
    return item;
  });
}

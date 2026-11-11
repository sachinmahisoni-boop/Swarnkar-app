import React from 'react';
import { JewelleryItem, MetalRate } from '../types';
import { X, AlertTriangle, AlertCircle, PackageCheck, ArrowRight } from 'lucide-react';

interface StockAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: JewelleryItem[];
  rates: MetalRate[];
  onNavigateToInventory: () => void;
}

export const StockAlertsModal: React.FC<StockAlertsModalProps> = ({
  isOpen,
  onClose,
  inventory,
  rates,
  onNavigateToInventory,
}) => {
  if (!isOpen) return null;

  const getRateForPurity = (metal: string, purity: string) => {
    const rateObj = rates.find(r => r.metal === metal && r.purity === purity);
    return rateObj ? rateObj.ratePerGram : 0;
  };

  const lowStockItems = inventory.filter(item => item.quantity <= item.minStockAlert);
  const outOfStockItems = inventory.filter(item => item.quantity === 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 font-serif">स्टॉक अलर्ट व पुनःआपूर्ति केंद्र (Stock Alert Center)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Items requiring restocking or low in store inventory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-700 dark:text-rose-400 font-bold">Out of Stock (शून्य स्टॉक)</span>
                <p className="text-2xl font-black text-rose-800 dark:text-rose-300">{outOfStockItems.length} items</p>
              </div>
              <AlertCircle className="w-8 h-8 text-rose-400 dark:text-rose-500" />
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-800 dark:text-amber-400 font-bold">Low Stock Alert (न्यूनतम शेष)</span>
                <p className="text-2xl font-black text-amber-900 dark:text-amber-300">{lowStockItems.length} items</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500 dark:text-amber-400" />
            </div>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <PackageCheck className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Inventory Well Stocked!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All jewellery stock levels are above minimum alert thresholds.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alert Items Details</h3>
              {lowStockItems.map(item => {
                const rate = getRateForPurity(item.metal, item.purity);
                const estValue = (item.netWeight * rate) + item.stoneValue;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-400 dark:hover:border-amber-500 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/30">
                          {item.tagNo}
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{item.name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-600 dark:text-slate-400">
                        <span>{item.metal} ({item.purity})</span>
                        <span>• Net Wt: <strong className="text-slate-900 dark:text-slate-200">{item.netWeight}g</strong></span>
                        <span>• Est. Val: <strong className="text-amber-700 dark:text-amber-400">₹{Math.round(estValue).toLocaleString('en-IN')}</strong></span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block px-3 py-1 rounded-xl text-xs font-extrabold ${
                        item.quantity === 0
                          ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                          : 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                      }`}>
                        {item.quantity === 0 ? 'Out of Stock (0)' : `Qty: ${item.quantity} (Min: ${item.minStockAlert})`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">Restock recommended before festive/peak gold buying dates.</p>
          <button
            onClick={() => {
              onClose();
              onNavigateToInventory();
            }}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <span>Manage Inventory</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

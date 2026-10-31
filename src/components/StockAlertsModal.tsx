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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Inventory Stock Alert Center</h2>
              <p className="text-xs text-slate-400">Items requiring restocking or low in store inventory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          
          {/* Summary Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-300 font-medium">Out of Stock</span>
                <p className="text-xl font-black text-rose-400">{outOfStockItems.length} items</p>
              </div>
              <AlertCircle className="w-8 h-8 text-rose-500/40" />
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-300 font-medium">Low Stock Alert</span>
                <p className="text-xl font-black text-amber-400">{lowStockItems.length} items</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500/40" />
            </div>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="text-center py-10 bg-slate-800/40 rounded-xl border border-slate-700/60">
              <PackageCheck className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-200">Inventory Well Stocked!</h3>
              <p className="text-xs text-slate-400 mt-1">All jewellery stock levels are above minimum alert thresholds.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alert Items Details</h3>
              {lowStockItems.map(item => {
                const rate = getRateForPurity(item.metal, item.purity);
                const estValue = (item.netWeight * rate) + item.stoneValue;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3 hover:border-slate-600 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-slate-700 px-1.5 py-0.5 rounded text-amber-300">
                          {item.tagNo}
                        </span>
                        <span className="font-bold text-slate-200 text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{item.metal} ({item.purity})</span>
                        <span>• Net Wt: {item.netWeight}g</span>
                        <span>• Est. Val: ₹{Math.round(estValue).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                        item.quantity === 0
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
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
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex justify-between items-center">
          <p className="text-xs text-slate-400">Restock recommended before festive/peak gold buying dates.</p>
          <button
            onClick={() => {
              onClose();
              onNavigateToInventory();
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>Manage Inventory</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

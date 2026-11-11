import React, { useState } from 'react';
import { JewelleryItem, MetalRate } from '../../types';
import { ShreemLogo } from '../ShreemLogo';
import { Printer, Scan, QrCode, Barcode as BarcodeIcon, Search, ShieldCheck, Check, Sparkles, Tag, SlidersHorizontal } from 'lucide-react';

interface BarcodeTagManagerProps {
  inventory: JewelleryItem[];
  rates: MetalRate[];
  onSelectForPOS?: (item: JewelleryItem) => void;
}

// Generate deterministic SVG Barcode Lines
const BarcodeSvg: React.FC<{ code: string; width?: number; height?: number }> = ({ code, width = 140, height = 36 }) => {
  // Deterministic bar widths from string hash
  const bars: { x: number; w: number }[] = [];
  let currentX = 5;
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let i = 0; i < code.length * 3 + 12; i++) {
    const val = (hash * (i + 7) * 31) % 10;
    const isBar = val > 3;
    const w = (val % 3 === 0 ? 2.5 : val % 2 === 0 ? 1.5 : 1);
    if (isBar && currentX < width - 10) {
      bars.push({ x: currentX, w });
    }
    currentX += w + 1;
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} className="overflow-visible">
        <rect x="0" y="0" width={width} height={height} fill="#ffffff" />
        {bars.map((bar, idx) => (
          <rect key={idx} x={bar.x} y="2" width={bar.w} height={height - 4} fill="#0f172a" />
        ))}
      </svg>
      <span className="font-mono text-[9px] tracking-widest text-slate-800 font-bold mt-0.5">
        *{code}*
      </span>
    </div>
  );
};

// Generate deterministic SVG QR Code
const QrCodeSvg: React.FC<{ data: string; size?: number }> = ({ data, size = 64 }) => {
  const cells = 15;
  const cellSize = size / cells;
  const hash = data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 17);

  const isFilled = (r: number, c: number) => {
    // Corner finder patterns (top-left, top-right, bottom-left)
    if (
      (r < 4 && c < 4) ||
      (r < 4 && c >= cells - 4) ||
      (r >= cells - 4 && c < 4)
    ) {
      if (
        (r === 1 && c === 1) || (r === 1 && c === cells - 2) || (r === cells - 2 && c === 1)
      ) return false;
      return true;
    }
    // Pseudo-random data dots based on string hash
    const dotHash = (hash * (r * 17 + c * 31 + 13)) % 100;
    return dotHash > 45;
  };

  const rects: { r: number; c: number }[] = [];
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (isFilled(r, c)) {
        rects.push({ r, c });
      }
    }
  }

  return (
    <svg width={size} height={size} className="bg-white p-0.5 rounded border border-slate-300">
      {rects.map((pt, i) => (
        <rect
          key={i}
          x={pt.c * cellSize}
          y={pt.r * cellSize}
          width={cellSize}
          height={cellSize}
          fill="#0f172a"
        />
      ))}
    </svg>
  );
};

export const BarcodeTagManager: React.FC<BarcodeTagManagerProps> = ({
  inventory,
  rates,
  onSelectForPOS,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagItem, setSelectedTagItem] = useState<JewelleryItem | null>(inventory[0] || null);
  const [tagFormat, setTagFormat] = useState<'dumbbell' | 'standard' | 'mini'>('dumbbell');
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);

  // Filtered inventory
  const filteredItems = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tagNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.huid && item.huid.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateApproxPrice = (item: JewelleryItem) => {
    const rate = rates.find(r => r.metal === item.metal && r.purity === item.purity)?.ratePerGram || 0;
    const metalVal = item.netWeight * rate;
    const wastageVal = item.netWeight * (item.wastagePercentage / 100) * rate;
    const makingVal = item.makingChargeType === 'per_gram' 
      ? item.netWeight * item.makingChargeRate 
      : item.makingChargeType === 'percentage'
      ? Math.round(metalVal * (item.makingChargeRate / 100))
      : item.makingChargeRate;
    const subtotal = metalVal + wastageVal + makingVal + item.stoneValue;
    return Math.round(subtotal * 1.03); // approx + 3% GST
  };

  const handleSimulateScan = (code: string) => {
    const found = inventory.find(i => i.tagNo === code || i.barcode === code || i.huid === code);
    if (found) {
      setSelectedTagItem(found);
      setScannedFeedback(`Item Matched: ${found.name} (Tag: ${found.tagNo})`);
      setTimeout(() => setScannedFeedback(null), 3500);
    } else {
      setScannedFeedback(`No item found for barcode: "${code}"`);
      setTimeout(() => setScannedFeedback(null), 3000);
    }
  };

  const handlePrintTags = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Scanner Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-lg transition">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400">
                <BarcodeIcon className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                  Jewellery Barcode & QR Code Tag Generator
                  <span className="text-xs bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/30 font-medium">
                    HUID 6-Digit Ready
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instant thermal dumbbell & barbell tag printing for Swarnkar Jewellers ERP.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Scanner Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Scan or enter Barcode / HUID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleSimulateScan(searchQuery.trim());
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-16 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <Scan className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              <button
                onClick={() => handleSimulateScan(searchQuery.trim())}
                className="absolute right-1 top-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg transition cursor-pointer"
              >
                Scan
              </button>
            </div>

            <button
              onClick={handlePrintTags}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Label Tag
            </button>
          </div>
        </div>

        {/* Scan Feedback alert */}
        {scannedFeedback && (
          <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{scannedFeedback}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Left List + Right Tag Preview & Thermal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Select Item to Tag (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col h-[650px] shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Stock Items ({filteredItems.length})
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Click to preview tag</span>
          </div>

          <div className="overflow-y-auto space-y-2 mt-3 pr-1 flex-1">
            {filteredItems.map(item => {
              const isSelected = selectedTagItem?.id === item.id;
              const approxPrice = calculateApproxPrice(item);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedTagItem(item)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400 dark:border-amber-500/50 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-slate-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-500/20">
                        {item.tagNo}
                      </span>
                      {item.huid && (
                        <span className="font-mono text-[10px] bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" /> {item.huid}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 line-clamp-1">{item.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{item.purity} {item.metal}</span>
                      <span>•</span>
                      <span>Gr: {item.grossWeight.toFixed(2)}g</span>
                      <span>•</span>
                      <span className="text-amber-700 dark:text-amber-400 font-bold">Nt: {item.netWeight.toFixed(2)}g</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">₹{approxPrice.toLocaleString('en-IN')}</p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Qty: {item.quantity}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Interactive Thermal Tag Preview & Print Simulator (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTagItem ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-xl transition">
              
              {/* Header Controls */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                    Thermal Jewellery Tag Preview
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Format: Industry Standard Foldable Dumbbell / Butterfly Jewelry Label
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
                    <button
                      onClick={() => setTagFormat('dumbbell')}
                      className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${tagFormat === 'dumbbell' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      Dumbbell (Butterfly)
                    </button>
                    <button
                      onClick={() => setTagFormat('standard')}
                      className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${tagFormat === 'standard' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      Barbell Tag
                    </button>
                  </div>
                </div>
              </div>

              {/* Thermal Label Physical Visualizer */}
              <div className="py-6 sm:py-8 px-2 sm:px-4 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80 my-4 overflow-x-auto">
                
                {/* Print area container */}
                <div id="printable-jewelry-tag" className="bg-white text-slate-900 rounded-lg shadow-xl p-3 border-2 border-slate-300 max-w-md w-full relative print:m-0 print:border-none print:shadow-none min-w-[320px]">
                  
                  {/* Dumbbell Tag Layout */}
                  {tagFormat === 'dumbbell' ? (
                    <div className="flex items-center justify-between gap-3">
                      
                      {/* Left Flap: Brand, HUID, QR */}
                      <div className="flex-1 border-r-2 border-dashed border-slate-300 pr-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <ShreemLogo size="sm" showText={false} />
                          <div className="text-right">
                            <span className="text-[10px] font-black uppercase text-amber-900 font-serif leading-none block">
                              Swarnkar Jewellers
                            </span>
                            <span className="text-[8px] font-bold text-slate-700 tracking-wider">
                              BHOPAL
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <QrCodeSvg data={`SWARNKAR:${selectedTagItem.tagNo}:HUID:${selectedTagItem.huid || 'NA'}`} size={52} />
                          <div className="text-[9px] leading-tight space-y-0.5">
                            <div className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-900 border border-slate-300">
                              TAG: {selectedTagItem.tagNo}
                            </div>
                            <div className="font-bold text-emerald-800 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3 text-emerald-700 inline" />
                              HUID: <span className="font-mono">{selectedTagItem.huid || 'SWK916'}</span>
                            </div>
                            <div className="text-slate-600 font-medium">
                              BIS 916 • HALLMARK
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Narrow Tail bridge for thread/ring loop */}
                      <div className="w-3 flex flex-col items-center justify-center gap-1 opacity-40">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                        <div className="w-1.5 h-8 bg-slate-300 rounded"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                      </div>

                      {/* Right Flap: Weights, Purity, Barcode & Price */}
                      <div className="flex-1 pl-2 space-y-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-black text-slate-900 block leading-tight">
                              {selectedTagItem.purity} {selectedTagItem.metal}
                            </span>
                            <span className="text-[9px] text-slate-600 block line-clamp-1 font-medium">
                              {selectedTagItem.category}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-black text-slate-950 font-mono">
                              ₹{calculateApproxPrice(selectedTagItem).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[8px] text-slate-500 block leading-none">+ 3% GST</span>
                          </div>
                        </div>

                        {/* Weight table */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] bg-slate-50 p-1 rounded border border-slate-200">
                          <div>
                            <span className="text-slate-500">Gr. Wt: </span>
                            <span className="font-mono font-bold">{selectedTagItem.grossWeight.toFixed(2)}g</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Net Wt: </span>
                            <span className="font-mono font-bold text-amber-900">{selectedTagItem.netWeight.toFixed(2)}g</span>
                          </div>
                          {selectedTagItem.stoneWeight > 0 && (
                            <div className="col-span-2 text-slate-600 text-[8px]">
                              St. Wt: {selectedTagItem.stoneWeight.toFixed(2)}g | St. Val: ₹{selectedTagItem.stoneValue}
                            </div>
                          )}
                        </div>

                        {/* Barcode Strip */}
                        <div className="pt-0.5 flex justify-center">
                          <BarcodeSvg code={selectedTagItem.barcode || selectedTagItem.tagNo} width={130} height={28} />
                        </div>
                      </div>

                    </div>
                  ) : (
                    /* Barbell Standard Layout */
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b pb-1">
                        <div className="flex items-center gap-1.5">
                          <ShreemLogo size="sm" showText={false} />
                          <div>
                            <span className="text-xs font-black uppercase text-amber-950 font-serif">
                              Swarnkar Jewellers
                            </span>
                            <span className="text-[9px] text-slate-600 block">Sarafa Bazar, Bhopal • M: 9202357851</span>
                          </div>
                        </div>
                        <div className="text-right font-mono text-xs font-black">
                          {selectedTagItem.tagNo}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="col-span-2 space-y-1">
                          <div className="text-xs font-bold text-slate-900">{selectedTagItem.name}</div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="bg-amber-100 text-amber-900 px-1 rounded font-bold">{selectedTagItem.purity}</span>
                            <span>GW: <strong>{selectedTagItem.grossWeight.toFixed(2)}g</strong></span>
                            <span>NW: <strong className="text-amber-800">{selectedTagItem.netWeight.toFixed(2)}g</strong></span>
                          </div>
                          <div className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-700" /> HUID: {selectedTagItem.huid || 'SWK916'} (BIS 916)
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-center">
                          <QrCodeSvg data={`SWARNKAR:${selectedTagItem.tagNo}`} size={48} />
                        </div>
                      </div>

                      <div className="border-t pt-1 flex justify-center">
                        <BarcodeSvg code={selectedTagItem.barcode || selectedTagItem.tagNo} width={200} height={32} />
                      </div>
                    </div>
                  )}

                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1.5 text-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Standard size 50mm x 15mm thermal sticker label compatible with Citizen, TSC & Zebra tag printers.
                </p>
              </div>

              {/* Tag Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Print Copies:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={printCopies}
                    onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-slate-200 text-center font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {onSelectForPOS && (
                    <button
                      onClick={() => onSelectForPOS(selectedTagItem)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      Load into POS Bill
                    </button>
                  )}
                  <button
                    onClick={handlePrintTags}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Print ({printCopies}) Tags
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
              <Tag className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
              <p>Select a jewellery item from the left to preview barcode & thermal tag.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

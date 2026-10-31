import React from 'react';
import { GSTInvoice, ShopDetails } from '../types';
import { ShreemLogo } from './ShreemLogo';
import { X, Printer, ShieldCheck, Download, CheckCircle2, MessageCircle, FileText, QrCode } from 'lucide-react';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: GSTInvoice | null;
  shopDetails: ShopDetails;
  customLogo?: string;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  invoice,
  shopDetails,
  customLogo,
}) => {
  if (!isOpen || !invoice) return null;

  const isGST = invoice.invoiceType !== 'ESTIMATE_BILL';

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const appUrl = window.location.href;
    const itemsSummary = invoice.items
      .map(i => `• ${i.name} (${i.purity}) - Net Wt: ${i.netWeight}g | ₹${i.subtotal.toLocaleString('en-IN')}`)
      .join('\n');

    const message = `*${isGST ? 'TAX INVOICE' : 'ESTIMATE MEMO'} - ${shopDetails.name}*
${isGST ? 'Invoice No:' : 'Estimate No:'} ${invoice.invoiceNumber}
Date: ${invoice.date}
Customer: ${invoice.customerName}
Phone: ${invoice.customerPhone}

*Ornaments Summary:*
${itemsSummary}
${invoice.oldMetalExchange && invoice.oldMetalExchange.totalCreditAmount > 0 ? `\n*Old Metal Credit Deducted:* -₹${invoice.oldMetalExchange.totalCreditAmount.toLocaleString('en-IN')}` : ''}

*Grand Total: ₹${invoice.grandTotal.toLocaleString('en-IN')}*
Payment: ${invoice.payment.dueAmount > 0 ? `Paid ₹${invoice.payment.amountPaid.toLocaleString('en-IN')} | Due ₹${invoice.payment.dueAmount.toLocaleString('en-IN')}` : 'Paid in Full'}

*Shreem Mahal Jewellers ERP*
Shop No 6, Ground Floor, Saideep Plaza, DK 2, Kolar, Bhopal - 462042
Mobile: +91 9202357851`;

    let cleanPhone = invoice.customerPhone ? invoice.customerPhone.replace(/[^0-9]/g, '') : '';
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto text-slate-900 flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        
        {/* Top Control Bar (Hidden during printing) */}
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-slate-100 print:hidden shrink-0">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-500/20 text-amber-300 text-xs font-mono px-2 py-1 rounded-lg border border-amber-500/30">
              {invoice.invoiceNumber}
            </span>
            <span className="font-bold text-slate-200">
              {isGST ? 'Official GST Tax Invoice Preview' : 'Non-GST Estimate / Quotation Preview'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleWhatsAppShare}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer"
              title="Share invoice summary via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              title="Print standard Tax Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-white flex-1 text-slate-900 print:p-0">
          <div className="border border-slate-300 p-6 sm:p-8 rounded-lg shadow-sm print:border-none print:p-0 print:shadow-none space-y-5">
            
            {/* Header: Golden Shree Logo & Shop Identity */}
            <div className="border-b-2 border-amber-600 pb-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Official Temple Dome Kalash & Sri Yantra Shree Logo */}
                <div className="flex items-center gap-3">
                  <ShreemLogo size="lg" showText={false} customLogo={customLogo || shopDetails.logoUrl} transparentBg={true} />
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-amber-950 uppercase tracking-tight font-serif leading-none">
                      Shreem Mahal Jewellers ERP
                    </h1>
                    <p className="text-xs font-semibold text-amber-800 tracking-wide mt-1">
                      {shopDetails.tagline}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 max-w-md font-medium">
                      Shop No 6, Ground Floor, Saideep Plaza, DK 2, Kolar, Bhopal - 462042
                    </p>
                    <p className="text-xs text-slate-700 font-semibold mt-0.5">
                      Phone: <span className="font-mono text-slate-900">+91 9202357851</span>
                    </p>
                  </div>
                </div>

                {/* Right Badges */}
                <div className="text-right space-y-1">
                  <div className={`inline-block px-3 py-1 rounded text-xs font-black uppercase tracking-wider ${isGST ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'bg-slate-200 text-slate-800 border border-slate-300'}`}>
                    {isGST ? 'TAX INVOICE (कर बीजक)' : 'ESTIMATE BILL (अनुमान रसीद)'}
                  </div>
                  {isGST ? (
                    <div className="text-[11px] text-slate-700 font-mono space-y-0.5">
                      <div>GSTIN: <strong className="text-slate-950">{shopDetails.gstin}</strong></div>
                      <div>BIS Reg No: <strong className="text-slate-950">{shopDetails.bisHallmarkRegNo}</strong></div>
                      <div>PAN: <strong className="text-slate-950">{shopDetails.panNo}</strong></div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 font-medium">
                      * Quotation Estimate Only - Non-taxable memo
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="space-y-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">Customer Details:</span>
                <p className="font-bold text-sm text-slate-900">{invoice.customerName}</p>
                <p className="text-slate-600">{invoice.customerAddress}</p>
                <p className="text-slate-700">Mobile: <strong className="font-mono">{invoice.customerPhone}</strong></p>
                {invoice.customerGSTIN && (
                  <p className="text-slate-700">Customer GSTIN: <strong className="font-mono">{invoice.customerGSTIN}</strong></p>
                )}
              </div>

              <div className="text-right space-y-1">
                <div className="flex justify-between sm:justify-end sm:gap-4">
                  <span className="text-slate-500">{isGST ? 'Invoice No:' : 'Estimate No:'}</span>
                  <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between sm:justify-end sm:gap-4">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-mono text-slate-900">{invoice.date}</span>
                </div>
                <div className="flex justify-between sm:justify-end sm:gap-4">
                  <span className="text-slate-500">Counter:</span>
                  <span className="font-bold text-slate-800">{invoice.counterName || 'Main Showroom Counter'}</span>
                </div>
                <div className="flex justify-between sm:justify-end sm:gap-4">
                  <span className="text-slate-500">Place of Supply:</span>
                  <span className="text-slate-900">{invoice.placeOfSupply || 'Madhya Pradesh (23)'}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <th className="p-2 border-r border-slate-300 text-center w-8">#</th>
                    <th className="p-2 border-r border-slate-300">Description of Jewellery</th>
                    <th className="p-2 border-r border-slate-300 text-center">HSN</th>
                    <th className="p-2 border-r border-slate-300 text-center">Purity</th>
                    <th className="p-2 border-r border-slate-300 text-right">Gross Wt</th>
                    <th className="p-2 border-r border-slate-300 text-right">Stone Wt</th>
                    <th className="p-2 border-r border-slate-300 text-right">Net Wt</th>
                    <th className="p-2 border-r border-slate-300 text-right">Rate ₹/g</th>
                    <th className="p-2 border-r border-slate-300 text-right">Making</th>
                    <th className="p-2 text-right">Total ₹</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 text-center border-r border-slate-200 font-mono">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200">
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono">
                          <span>Tag: {item.tagNo}</span>
                          {item.huid && (
                            <span className="text-emerald-800 font-bold bg-emerald-50 px-1 rounded border border-emerald-200">
                              HUID: {item.huid} (BIS 916)
                            </span>
                          )}
                        </div>
                        {item.stoneDetails && (
                          <div className="text-[10px] text-slate-500">
                            Stone: {item.stoneDetails.type} ({item.stoneDetails.carat} Ct / {item.stoneDetails.ratti} Ratti)
                            {item.stoneDetails.certNo && ` • Cert: ${item.stoneDetails.certNo}`}
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-600">{item.hsnCode}</td>
                      <td className="p-2 text-center border-r border-slate-200 font-bold text-amber-900">{item.purity}</td>
                      <td className="p-2 text-right border-r border-slate-200 font-mono">{item.grossWeight.toFixed(2)}g</td>
                      <td className="p-2 text-right border-r border-slate-200 font-mono text-slate-600">
                        {item.stoneWeight > 0 ? `${item.stoneWeight.toFixed(2)}g` : '-'}
                      </td>
                      <td className="p-2 text-right border-r border-slate-200 font-mono font-bold text-slate-900">
                        {item.netWeight.toFixed(2)}g
                      </td>
                      <td className="p-2 text-right border-r border-slate-200 font-mono">₹{item.metalRateApplied.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right border-r border-slate-200 font-mono">₹{item.makingCharge.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right font-mono font-bold text-slate-950">₹{item.subtotal.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Old Metal Exchange Box (if present) */}
            {invoice.oldMetalExchange && invoice.oldMetalExchange.totalCreditAmount > 0 && (
              <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-300 text-xs">
                <span className="font-bold text-amber-950 block text-[11px] uppercase tracking-wide">
                  Old Metal Buyback / Exchange (पुरानी सोना / चांदी वापसी):
                </span>
                <div className="grid grid-cols-4 gap-2 mt-1 text-[11px] font-mono">
                  <div>Metal: <strong>{invoice.oldMetalExchange.purity} {invoice.oldMetalExchange.metal}</strong></div>
                  <div>Gross Wt: <strong>{invoice.oldMetalExchange.grossWeight.toFixed(2)}g</strong></div>
                  <div>Melt Loss: <strong>{invoice.oldMetalExchange.dustWastageGram.toFixed(2)}g</strong></div>
                  <div className="text-right font-bold text-rose-700">
                    Credit: -₹{invoice.oldMetalExchange.totalCreditAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Total Calculation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              
              {/* Left Column: Bank Details & Terms */}
              <div className="space-y-2 text-slate-600 text-[11px]">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="font-bold text-slate-800 block text-[10px] uppercase">Bank Account Details (for NEFT/RTGS/UPI):</span>
                  <div>Bank: <strong className="text-slate-900">{shopDetails.bankName}</strong></div>
                  <div>A/C No: <strong className="font-mono text-slate-900">{shopDetails.accountNo}</strong></div>
                  <div>IFSC: <strong className="font-mono text-slate-900">{shopDetails.ifscCode}</strong></div>
                </div>

                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 block text-[10px]">Terms & Conditions:</span>
                  <ul className="list-disc pl-3 text-[10px] space-y-0.5 text-slate-500">
                    <li>All gold ornaments sold are 100% BIS 6-Digit HUID Hallmarked (916/750).</li>
                    <li>Exchange value calculated on prevailing daily bullion rate in Bhopal Sarafa.</li>
                    <li>Goods once sold can be exchanged within 7 days against this receipt.</li>
                    <li>Subject to Bhopal Jurisdiction only.</li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Calculations */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Item Total:</span>
                  <span className="font-mono font-bold text-slate-800">₹{invoice.itemsSubtotal.toLocaleString('en-IN')}</span>
                </div>

                {invoice.oldMetalDeduction > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>Less: Old Metal Credit:</span>
                    <span className="font-mono font-bold">- ₹{invoice.oldMetalDeduction.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-800">
                  <span>Taxable Amount:</span>
                  <span className="font-mono">₹{invoice.taxableAmount.toLocaleString('en-IN')}</span>
                </div>

                {/* GST Lines */}
                {isGST ? (
                  invoice.isInterState ? (
                    <div className="flex justify-between text-slate-600">
                      <span>IGST (3.0%):</span>
                      <span className="font-mono font-bold">₹{invoice.igstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>CGST (1.5%):</span>
                        <span className="font-mono font-bold">₹{invoice.cgstAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>SGST (1.5%):</span>
                        <span className="font-mono font-bold">₹{invoice.sgstAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )
                ) : null}

                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount / Round off:</span>
                    <span className="font-mono font-bold">- ₹{invoice.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Final Grand Total */}
                <div className="flex justify-between items-center p-2.5 bg-amber-100/80 border border-amber-300 rounded-lg text-amber-950 font-black text-base mt-2">
                  <span>GRAND TOTAL:</span>
                  <span className="font-mono text-lg">₹{invoice.grandTotal.toLocaleString('en-IN')}</span>
                </div>

                {/* Payment Summary */}
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-0.5">
                  <div className="flex justify-between text-slate-700">
                    <span>Payment Mode: <strong>{invoice.payment.method}</strong></span>
                    <span>Paid: <strong className="font-mono text-emerald-700">₹{invoice.payment.amountPaid.toLocaleString('en-IN')}</strong></span>
                  </div>
                  {invoice.payment.dueAmount > 0 && (
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Balance Due:</span>
                      <span className="font-mono">₹{invoice.payment.dueAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Signature Area */}
            <div className="border-t border-slate-300 pt-6 mt-6 flex justify-between items-end text-xs">
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 mb-1"></div>
                <span className="text-[10px] text-slate-500">Customer's Signature</span>
              </div>

              <div className="text-center">
                <p className="text-[11px] font-bold text-slate-800">For SHREEM MAHAL JEWELLERS ERP</p>
                <div className="w-40 border-b border-slate-400 my-4"></div>
                <span className="text-[10px] text-slate-500">Authorised Signatory</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

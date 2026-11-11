export type MetalType = 'Gold' | 'Silver' | 'Platinum' | 'Diamond' | 'Gemstone';

export type GoldPurity = '24K' | '22K' | '18K' | '14K' | '9K';
export type SilverPurity = '999 Fine' | '925 Sterling';
export type PlatinumPurity = '950 Platinum';
export type GemstonePurity = 'Natural Certified' | 'Untreated Astrological' | 'Standard Gem' | 'Lab Certified';

// Allow predefined and dynamic custom categories
export type ItemCategory = string;

export interface MetalRate {
  firmId?: string;
  metal: MetalType;
  purity: string;
  ratePerGram: number; // in INR ₹
  lastUpdated: string;
}

export interface GemstoneRate {
  id: string;
  name: string; // e.g. Panna (Zambian Emerald)
  hindiName: string; // पन्ना (जाम्बियन)
  gemType: string; // Emerald, Ruby, Yellow Sapphire, Blue Sapphire, Pearl, Coral, Hessonite, Cats Eye, Diamond, Opal
  planet: string; // e.g. बुध (Mercury)
  grade: 'Astrological (सर्वोत्तम)' | 'Fine Premium' | 'Commercial';
  ratePerRatti: number;
  ratePerCarat: number;
  lastUpdated: string;
}

export interface CertifiedGemstone {
  id: string;
  tagNo: string;
  name: string;
  hindiName: string;
  gemType: string;
  planet: string;
  carat: number;
  ratti: number;
  gramWeight: number; // carat * 0.2
  color: string;
  cutShape: string;
  clarity: string;
  origin: string;
  treatment: string;
  labName: string;
  labCertNo: string;
  ratePerRatti: number;
  ratePerCarat: number;
  sellingPrice: number;
  costPrice: number;
  stockStatus: 'In Stock' | 'Sold' | 'Reserved';
  dateAdded: string;
  description?: string;
}

export interface CityMetalRates {
  city: string;
  state: string;
  rates: MetalRate[];
}

export interface JewellerProfile {
  id: string;
  firmId?: string;
  code: string;
  name: string;
  counterName: string;
  counterType: 'Main Showroom' | 'Counter 2 (Silver & Gem)' | 'Wholesale & Bullion' | 'Girvi & Karigar Desk';
  operatorName: string;
  gstin: string;
  phone: string;
  isDefault?: boolean;
  logoUrl?: string; // Custom profile / branch logo (Base64 dataUrl or file path)
}

export interface JewelleryItem {
  id: string;
  firmId?: string;
  tagNo: string; // e.g., SMJ-2026-001
  huid?: string; // 6-digit alphanumeric BIS HUID e.g. SMJ789
  name: string;
  category: ItemCategory;
  metal: MetalType;
  purity: string; // '24K', '22K', '18K', '14K', '9K', '999 Fine', '925 Sterling'
  grossWeight: number; // in grams
  netWeight: number; // metal weight in grams
  stoneWeight: number; // in grams or carats
  stoneValue: number; // ₹ value of stones/diamonds
  stoneType?: string; // Diamond, Ruby, Emerald, etc.
  stoneCarat?: number; // Carat
  ratti?: number; // Astrological Ratti weight
  gemOrigin?: string; // e.g. Ceylon Sri Lanka, Burma, Zambia, Colombia
  gemTreatment?: string; // e.g. Natural Untreated, Mild Heat
  gemCut?: string; // e.g. Oval Mixed Cut, Cushion, Emerald Cut
  gemColor?: string; // e.g. Vivid Green, Pigeon Blood Red, Royal Blue
  gemLab?: string; // e.g. GTL Jaipur, IGI, GIA, IGL
  labCertNo?: string; // GIA, IGI, Govt Lab
  wastagePercentage: number; // % wastage/touch
  makingChargeType: 'per_gram' | 'flat' | 'percentage';
  makingChargeRate: number; // ₹ per gram, flat ₹, or % rate
  makingChargePerGram?: number;
  makingChargeFixed?: number;
  // Cost Price & Profit Analytics
  costPrice?: number; // Total unit acquisition cost price in ₹
  purchaseRatePerGram?: number; // Raw metal wholesale cost rate per gram
  makingCostPerGram?: number; // Karigar labor cost per gram paid by shop
  stoneCost?: number; // Wholesale acquisition cost of stones
  hsnCode: string; // e.g. '7113' for jewellery, '7106' for silver, '7102' for diamonds
  quantity: number;
  minStockAlert: number;
  barcode: string; // Code 128 / Barcode string
  qrData?: string;
  image?: string;
  description?: string;
}

export interface InvoiceItem {
  itemId?: string;
  tagNo: string;
  huid?: string;
  name: string;
  category: ItemCategory;
  metal: MetalType;
  purity: string;
  grossWeight: number;
  netWeight: number;
  stoneWeight: number;
  stoneValue: number;
  stoneDetails?: {
    type: string;
    carat: number;
    ratti: number;
    certNo?: string;
  };
  metalRateApplied: number; // ₹ per gram
  metalCost: number; // netWeight * rate
  wastagePercentage: number;
  wastageCost: number; // netWeight * (wastage % / 100) * rate
  makingChargeType: 'per_gram' | 'flat' | 'percentage';
  makingChargeRate: number;
  makingCharge: number; // total making charge
  huidCharge?: number; // Hallmarking charge (₹45 + tax)
  subtotal: number;
  // Profit Tracking
  costPrice?: number; // Unit Cost Price in ₹
  unitProfit?: number; // subtotal - costPrice
  profitMarginPercent?: number; // (profit / subtotal) * 100
  hsnCode: string;
  quantity: number;
}

export interface ProfitCategorySummary {
  category: string;
  salesCount: number;
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  marginPercent: number;
  markupPercent: number;
}

export interface ProfitItemRecord {
  tagNo: string;
  huid?: string;
  name: string;
  category: string;
  metal: MetalType;
  purity: string;
  netWeight: number;
  grossWeight: number;
  costPrice: number;
  salePrice: number;
  profitAmount: number;
  marginPercent: number;
  markupPercent: number;
  date: string;
  invoiceNo?: string;
  customerName?: string;
  isSold: boolean;
  quantity: number;
}

export interface OldMetalExchange {
  mode: 'weight_rate' | 'lump_sum';
  metal: MetalType;
  purity: string;
  grossWeight: number;
  dustWastageGram: number; // काट / melt loss
  meltPurityPercent: number; // टच / purity % (e.g. 91.6%, 75%, 85%)
  netWeight: number;
  ratePerGram: number;
  lumpSumAmount?: number; // For Mode B direct lump-sum override
  totalCreditAmount: number; // Deduction from bill
  description?: string;
}

export interface Customer {
  id: string;
  firmId?: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  gstin?: string;
  aadhaar?: string;
  pan?: string;
  totalPurchases: number;
  outstandingBalance: number;
  createdAt: string;
}

export type PaymentMethod = 'Cash' | 'UPI/GPay' | 'Card' | 'Bank Transfer' | 'Mixed';

export interface PaymentDetails {
  method: PaymentMethod;
  amountPaid: number;
  dueAmount: number;
  transactionRef?: string;
}

export type InvoiceType = 'GST_INVOICE' | 'ESTIMATE_BILL';

export interface GSTInvoice {
  id: string;
  firmId?: string;
  invoiceNumber: string; // e.g., SMJ-INV-2026-0089 or SMJ-EST-2026-0042
  invoiceType: InvoiceType; // 'GST_INVOICE' = Pakka Bill, 'ESTIMATE_BILL' = Kachha / Estimate
  date: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerGSTIN?: string;
  placeOfSupply: string;
  isInterState: boolean;
  profileId?: string;
  counterName?: string;
  
  items: InvoiceItem[];
  oldMetalExchange?: OldMetalExchange;
  
  itemsSubtotal: number;
  oldMetalDeduction: number;
  taxableAmount: number;
  
  cgstRate: number; // 1.5%
  sgstRate: number; // 1.5%
  igstRate: number; // 3.0%
  
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  
  hallmarkingTotalFee: number;
  discountAmount: number;
  grandTotal: number;
  
  payment: PaymentDetails;
  status: 'Paid' | 'Partial' | 'Unpaid';
  notes?: string;
  hallmarkCertified: boolean;
}

export interface Vendor {
  id: string;
  firmId?: string;
  firmName: string; // e.g. Zaveri Bullion Mumbai
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  gstin?: string;
  pan?: string;
  bankDetails?: string;
  goldBalanceOwed: number; // Fine gold owed to vendor in grams
  silverBalanceOwed: number; // Fine silver owed in grams
  cashBalanceDue: number; // Cash ₹ owed to vendor
  totalPurchasesAmount: number;
  createdAt: string;
}

// Purchase / Inward Stock Entry (खरीद / माल की आवक)
export interface PurchaseItem {
  id?: string;
  name: string;
  category: ItemCategory;
  metal: MetalType;
  purity: string;
  grossWeight: number;
  netWeight: number;
  ratePerGram: number;
  makingCharge: number;
  stoneWeight: number;
  stoneValue: number;
  totalAmount: number;
  hsnCode: string;
  quantity: number;
  huid?: string;
  addToStock: boolean;
}

export interface PurchaseInvoice {
  id: string;
  firmId?: string;
  purchaseBillNo: string; // e.g. PUR-2026-0018
  vendorId: string;
  vendorName: string;
  vendorFirm: string;
  vendorGSTIN?: string;
  date: string;
  items: PurchaseItem[];
  totalGrossWeight: number;
  totalNetWeight: number;
  subtotal: number;
  gstRate: number; // 3% GST
  gstAmount: number;
  grandTotal: number;
  paymentMode: 'Cash' | 'Bank Transfer' | 'UPI' | 'Metal Barter' | 'Credit / Udhar';
  amountPaid: number;
  balanceDue: number;
  fineGoldEquivalent: number; // Fine metal weight in grams
  notes?: string;
}

// Shop Daily Expenses (दुकान खर्चे)
export type ExpenseCategory = 
  | 'Staff Salary' 
  | 'Shop Rent' 
  | 'Electricity & AC' 
  | 'Tea & Refreshment (चाय-नाश्ता)' 
  | 'Polish, Chhilai & Tools' 
  | 'Hallmarking & Testing Fees' 
  | 'Freight, Courier & Security' 
  | 'Marketing & Printing' 
  | 'Office & Misc Maintenance';

export interface ShopExpense {
  id: string;
  firmId?: string;
  voucherNo: string; // e.g. EXP-2026-042
  date: string;
  category: ExpenseCategory;
  amount: number;
  paymentSource: 'Cash in Hand' | 'Bank Account';
  paidTo: string;
  notes?: string;
}

// Cash & Bank Reconciliation
export interface CashBankTransfer {
  id: string;
  firmId?: string;
  date: string;
  type: 'DEPOSIT_TO_BANK' | 'WITHDRAW_FROM_BANK';
  amount: number;
  description: string;
}

// Karigar (Goldsmith) Job Card Ledger types
export interface Karigar {
  id: string;
  firmId?: string;
  name: string;
  phone: string;
  address: string;
  specialization: string; // e.g., 'Kundan & Jadau', 'Plain Gold Casting', 'Silver Filigree'
  goldBalanceGram: number; // Positive = Karigar owes metal, Negative = Shop owes
  silverBalanceGram: number;
  cashDue: number; // Labor charges unpaid
  activeJobsCount: number;
}

export interface KarigarJobCard {
  id: string;
  firmId?: string;
  jobNo: string; // e.g. KJB-2026-015
  karigarId: string;
  karigarName: string;
  issueDate: string;
  expectedDeliveryDate: string;
  status: 'Issued' | 'In Progress' | 'Received' | 'Settled';
  metal: MetalType;
  purity: string;
  rawMetalIssuedWeight: number; // in grams
  expectedPurityLossPercent: number; // टच/काट wastage allowance %
  itemDescription: string;
  designSampleUrl?: string;
  // Receiving details
  receivedDate?: string;
  finishedOrnamentWeight?: number; // Gross wt
  stoneWeightAdded?: number;
  scrapReturnedWeight?: number; // Chhilai / scrap
  actualLossWeight?: number;
  wastageAllowedWeight?: number;
  laborRatePerGram: number;
  totalLaborCharge: number;
  laborPaid: number;
  notes?: string;
}

// Girvi (Pawn Loan) Ledger & Calculator types
export interface PledgedItem {
  description: string;
  metal: MetalType;
  purity: string;
  quantity: number;
  grossWeight: number;
  netWeight: number;
  estimatedMarketRate: number;
  valuationAmount: number;
}

export interface GirviLoan {
  id: string;
  firmId?: string;
  loanNo: string; // e.g. GRV-2026-042
  date: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerAddress: string;
  borrowerAadhaar: string;
  items: PledgedItem[];
  totalGrossWeight: number;
  totalNetWeight: number;
  totalValuation: number;
  principalAmount: number; // Cash loan given
  monthlyInterestRate: number; // % per month (e.g. 2.0%)
  tenureMonths: number;
  status: 'Active' | 'Redeemed' | 'Overdue' | 'Auctioned';
  redeemedDate?: string;
  interestPaidSoFar: number;
  principalPaid: number;
  balanceDue: number;
  notes?: string;
}

export interface ShopDetails {
  firmId?: string;
  name: string;
  tagline: string;
  address: string;
  cityStatePincode: string;
  phone: string;
  email: string;
  gstin: string;
  bisHallmarkRegNo: string;
  panNo: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  terms: string[];
  logoUrl?: string; // Custom global shop logo
}

import { JewelleryItem, Customer, GSTInvoice, MetalRate, ShopDetails, CityMetalRates, JewellerProfile, Karigar, KarigarJobCard, GirviLoan, Vendor, PurchaseInvoice, ShopExpense, CashBankTransfer } from '../types';

export const initialShopDetails: ShopDetails = {
  name: "Shreem Mahal Jewellers ERP",
  tagline: "Certified BIS Hallmark 916/750 Gold, 999 Silver & Certified Diamonds",
  address: "Shop No 6, Ground Floor, Saideep Plaza, DK 2, Kolar",
  cityStatePincode: "Bhopal - 462042, Madhya Pradesh",
  phone: "+91 9202357851",
  email: "contact@shreemmahaljewellers.com",
  gstin: "23AAMCS9202B1Z8", // 23 = Madhya Pradesh GST state code
  bisHallmarkRegNo: "HM-MP-BPL-2024-9160",
  panNo: "AAMCS9202B",
  bankName: "State Bank of India (Kolar Road Branch, Bhopal)",
  accountNo: "392023578510",
  ifscCode: "SBIN0012894",
  terms: [
    "All gold ornaments are 100% BIS 6-digit HUID Hallmarked (916/750/585).",
    "Goods once sold can be exchanged within 7 days against original invoice in original condition.",
    "Exchange & buyback value calculated on prevailing daily bullion rate in Bhopal as per MP Sarafa guidelines.",
    "Old Gold exchange subject to fire-assay / touch test purity deduction.",
    "Subject to Bhopal Jurisdiction only."
  ]
};

export const defaultCity = "Bhopal";

export const initialProfiles: JewellerProfile[] = [
  {
    id: 'prof-main',
    code: 'SMJ-CTR-01',
    name: 'Shreem Mahal Jewellers - Main Showroom',
    counterName: 'Main Retail Counter (Gold & Diamond)',
    counterType: 'Main Showroom',
    operatorName: 'Sachin Soni (Senior Manager)',
    gstin: '23AAMCS9202B1Z8',
    phone: '+91 9202357851',
    isDefault: true,
  },
  {
    id: 'prof-silver',
    code: 'SMJ-CTR-02',
    name: 'Shreem Mahal Jewellers - Counter 2',
    counterName: 'Silver, Payal & Gemstone Section',
    counterType: 'Counter 2 (Silver & Gem)',
    operatorName: 'Mahesh Verma (Counter Incharge)',
    gstin: '23AAMCS9202B1Z8',
    phone: '+91 9202357851',
  },
  {
    id: 'prof-wholesale',
    code: 'SMJ-CTR-03',
    name: 'Shreem Mahal Jewellers - Wholesale Desk',
    counterName: 'Wholesale & Bullion Trading Desk',
    counterType: 'Wholesale & Bullion',
    operatorName: 'Anand Soni (Bullion Desk)',
    gstin: '23AAMCS9202B1Z8',
    phone: '+91 9202357851',
  },
  {
    id: 'prof-girvi',
    code: 'SMJ-CTR-04',
    name: 'Shreem Mahal Jewellers - Girvi & Karigar',
    counterName: 'Pawn Loan (गिरवी) & Karigar Ledger Counter',
    counterType: 'Girvi & Karigar Desk',
    operatorName: 'Rameshwar Ji (Head Accountant)',
    gstin: '23AAMCS9202B1Z8',
    phone: '+91 9202357851',
  }
];

export const cityRatesPresets: CityMetalRates[] = [
  {
    city: "Bhopal",
    state: "Madhya Pradesh",
    rates: [
      { metal: 'Gold', purity: '24K', ratePerGram: 14225, lastUpdated: 'Live A To Z Bullion Bhopal (₹1,42,225 / 10g)' },
      { metal: 'Gold', purity: '22K', ratePerGram: 13085, lastUpdated: 'Live A To Z Bullion Bhopal (₹1,30,848 / 10g)' },
      { metal: 'Gold', purity: '18K', ratePerGram: 10809, lastUpdated: 'Live A To Z Bullion Bhopal (₹1,08,091 / 10g)' },
      { metal: 'Gold', purity: '14K', ratePerGram: 8295, lastUpdated: 'Live A To Z Bullion Bhopal (₹82,950 / 10g)' },
      { metal: 'Gold', purity: '9K', ratePerGram: 5335, lastUpdated: 'Live A To Z Bullion Bhopal (₹53,350 / 10g)' },
      { metal: 'Silver', purity: '999 Fine', ratePerGram: 190.3, lastUpdated: 'Live A To Z Bullion Bhopal (₹1,90,292 / kg)' },
      { metal: 'Silver', purity: '925 Sterling', ratePerGram: 176.0, lastUpdated: 'Live A To Z Bullion Bhopal (₹1,76,000 / kg)' },
      { metal: 'Platinum', purity: '950 Platinum', ratePerGram: 3850, lastUpdated: 'Today, Live Market' },
    ]
  },
  {
    city: "Indore",
    state: "Madhya Pradesh",
    rates: [
      { metal: 'Gold', purity: '24K', ratePerGram: 14210, lastUpdated: 'Today, 10:00 AM (Indore Sarafa)' },
      { metal: 'Gold', purity: '22K', ratePerGram: 13070, lastUpdated: 'Today, 10:00 AM (Indore Sarafa)' },
      { metal: 'Gold', purity: '18K', ratePerGram: 10795, lastUpdated: 'Today, 10:00 AM (Indore Sarafa)' },
      { metal: 'Gold', purity: '14K', ratePerGram: 8280, lastUpdated: 'Today, 10:00 AM (Indore Sarafa)' },
      { metal: 'Gold', purity: '9K', ratePerGram: 5325, lastUpdated: 'Today, 10:00 AM (Indore Sarafa)' },
      { metal: 'Silver', purity: '999 Fine', ratePerGram: 190.0, lastUpdated: 'Today, 10:00 AM (Indore Sarafa)' },
      { metal: 'Silver', purity: '925 Sterling', ratePerGram: 175.8, lastUpdated: 'Today, 10:00 AM (Indore Sarafa)' },
      { metal: 'Platinum', purity: '950 Platinum', ratePerGram: 3840, lastUpdated: 'Today, 10:00 AM' },
    ]
  },
  {
    city: "Mumbai",
    state: "Maharashtra",
    rates: [
      { metal: 'Gold', purity: '24K', ratePerGram: 14230, lastUpdated: 'Today, 09:30 AM (IBJA)' },
      { metal: 'Gold', purity: '22K', ratePerGram: 13090, lastUpdated: 'Today, 09:30 AM (IBJA)' },
      { metal: 'Gold', purity: '18K', ratePerGram: 10815, lastUpdated: 'Today, 09:30 AM (IBJA)' },
      { metal: 'Gold', purity: '14K', ratePerGram: 8300, lastUpdated: 'Today, 09:30 AM (IBJA)' },
      { metal: 'Gold', purity: '9K', ratePerGram: 5340, lastUpdated: 'Today, 09:30 AM (IBJA)' },
      { metal: 'Silver', purity: '999 Fine', ratePerGram: 190.5, lastUpdated: 'Today, 09:30 AM (IBJA)' },
      { metal: 'Silver', purity: '925 Sterling', ratePerGram: 176.2, lastUpdated: 'Today, 09:30 AM (IBJA)' },
      { metal: 'Platinum', purity: '950 Platinum', ratePerGram: 3860, lastUpdated: 'Today, 09:30 AM' },
    ]
  },
  {
    city: "Delhi",
    state: "Delhi NCR",
    rates: [
      { metal: 'Gold', purity: '24K', ratePerGram: 14245, lastUpdated: 'Today, 09:30 AM (Delhi Sarafa)' },
      { metal: 'Gold', purity: '22K', ratePerGram: 13105, lastUpdated: 'Today, 09:30 AM (Delhi Sarafa)' },
      { metal: 'Gold', purity: '18K', ratePerGram: 10825, lastUpdated: 'Today, 09:30 AM (Delhi Sarafa)' },
      { metal: 'Gold', purity: '14K', ratePerGram: 8310, lastUpdated: 'Today, 09:30 AM (Delhi Sarafa)' },
      { metal: 'Gold', purity: '9K', ratePerGram: 5350, lastUpdated: 'Today, 09:30 AM (Delhi Sarafa)' },
      { metal: 'Silver', purity: '999 Fine', ratePerGram: 190.8, lastUpdated: 'Today, 09:30 AM (Delhi Sarafa)' },
      { metal: 'Silver', purity: '925 Sterling', ratePerGram: 176.5, lastUpdated: 'Today, 09:30 AM (Delhi Sarafa)' },
      { metal: 'Platinum', purity: '950 Platinum', ratePerGram: 3860, lastUpdated: 'Today, 09:30 AM' },
    ]
  },
  {
    city: "Jaipur",
    state: "Rajasthan",
    rates: [
      { metal: 'Gold', purity: '24K', ratePerGram: 14235, lastUpdated: 'Today, 09:30 AM (Jaipur Sarafa)' },
      { metal: 'Gold', purity: '22K', ratePerGram: 13095, lastUpdated: 'Today, 09:30 AM (Jaipur Sarafa)' },
      { metal: 'Gold', purity: '18K', ratePerGram: 10815, lastUpdated: 'Today, 09:30 AM (Jaipur Sarafa)' },
      { metal: 'Gold', purity: '14K', ratePerGram: 8305, lastUpdated: 'Today, 09:30 AM (Jaipur Sarafa)' },
      { metal: 'Gold', purity: '9K', ratePerGram: 5340, lastUpdated: 'Today, 09:30 AM (Jaipur Sarafa)' },
      { metal: 'Silver', purity: '999 Fine', ratePerGram: 190.6, lastUpdated: 'Today, 09:30 AM (Jaipur Sarafa)' },
      { metal: 'Silver', purity: '925 Sterling', ratePerGram: 176.3, lastUpdated: 'Today, 09:30 AM (Jaipur Sarafa)' },
      { metal: 'Platinum', purity: '950 Platinum', ratePerGram: 3855, lastUpdated: 'Today, 09:30 AM' },
    ]
  }
];

export const initialRates: MetalRate[] = cityRatesPresets[0].rates;

export const initialInventory: JewelleryItem[] = [
  {
    id: 'item-01',
    tagNo: 'SMJ-2026-001',
    huid: 'SMJ789',
    name: 'Royal Kundan Gold Necklace (916 Hallmarked)',
    category: 'Necklace',
    metal: 'Gold',
    purity: '22K',
    grossWeight: 45.85,
    netWeight: 41.20,
    stoneWeight: 4.65,
    stoneValue: 12500,
    wastagePercentage: 3.5,
    makingChargeType: 'per_gram',
    makingChargeRate: 550,
    hsnCode: '7113',
    quantity: 3,
    minStockAlert: 1,
    barcode: 'SMJ2026001',
    description: 'Traditional heritage Bhopal style choker necklace with floral kundan setting and drop pearls.'
  },
  {
    id: 'item-02',
    tagNo: 'SMJ-2026-002',
    huid: 'SMJ452',
    name: 'Solitaire Diamond Ring (18K White Gold)',
    category: 'Rings',
    metal: 'Gold',
    purity: '18K',
    grossWeight: 4.20,
    netWeight: 4.02,
    stoneWeight: 0.18, // ~0.90 ct
    stoneValue: 65000,
    stoneType: 'Diamond (VVS-EF)',
    stoneCarat: 0.90,
    labCertNo: 'IGI-5928174',
    wastagePercentage: 0,
    makingChargeType: 'flat',
    makingChargeRate: 4500,
    hsnCode: '7113',
    quantity: 5,
    minStockAlert: 2,
    barcode: 'SMJ2026002',
    description: 'Certified 0.90 ct natural diamond solitaire ring in 18K gold band.'
  },
  {
    id: 'item-03',
    tagNo: 'SMJ-2026-003',
    huid: 'SMJ916',
    name: 'Classic Antique Gold Bangles (Set of 2 - 22K)',
    category: 'Bangles',
    metal: 'Gold',
    purity: '22K',
    grossWeight: 32.50,
    netWeight: 32.50,
    stoneWeight: 0,
    stoneValue: 0,
    wastagePercentage: 2.5,
    makingChargeType: 'per_gram',
    makingChargeRate: 420,
    hsnCode: '7113',
    quantity: 4,
    minStockAlert: 2,
    barcode: 'SMJ2026003',
    description: '22K Hallmarked solid filigree kada bangles with screw clasp.'
  },
  {
    id: 'item-04',
    tagNo: 'SMJ-2026-004',
    huid: 'SMJ104',
    name: 'Traditional 22K Gold Mangalsutra with Black Beads',
    category: 'Mangalsutra',
    metal: 'Gold',
    purity: '22K',
    grossWeight: 18.40,
    netWeight: 16.20,
    stoneWeight: 2.20,
    stoneValue: 3500,
    wastagePercentage: 3.0,
    makingChargeType: 'per_gram',
    makingChargeRate: 480,
    hsnCode: '7113',
    quantity: 6,
    minStockAlert: 2,
    barcode: 'SMJ2026004',
    description: 'Double strand black moti chain with 22K yellow gold auspicious pendant.'
  },
  {
    id: 'item-05',
    tagNo: 'SMJ-2026-005',
    huid: 'SLV889',
    name: 'Heavy Bridal Silver Payal (925 Sterling Ghungroo)',
    category: 'Anklets (Payal)',
    metal: 'Silver',
    purity: '925 Sterling',
    grossWeight: 145.00,
    netWeight: 145.00,
    stoneWeight: 0,
    stoneValue: 0,
    wastagePercentage: 5.0,
    makingChargeType: 'per_gram',
    makingChargeRate: 18,
    hsnCode: '7113',
    quantity: 8,
    minStockAlert: 3,
    barcode: 'SMJ2026005',
    description: 'Hallmarked 92.5 sterling silver traditional heavy chandi payal with resonant ghungroo.'
  },
  {
    id: 'item-06',
    tagNo: 'SMJ-2026-006',
    name: '24K Pure Gold Minted Coin (Laxmi-Ganesh 10g)',
    category: 'Coins & Bars',
    metal: 'Gold',
    purity: '24K',
    grossWeight: 10.00,
    netWeight: 10.00,
    stoneWeight: 0,
    stoneValue: 0,
    wastagePercentage: 0,
    makingChargeType: 'flat',
    makingChargeRate: 650,
    hsnCode: '7113',
    quantity: 12,
    minStockAlert: 5,
    barcode: 'SMJ2026006',
    description: '999.9 Purity Swiss-style tamper-proof blister pack gold bullion coin.'
  },
  {
    id: 'item-07',
    tagNo: 'SMJ-2026-007',
    name: 'Certified Natural Emerald (पन्ना - Zambian 4.25 Ratti)',
    category: 'Loose Gemstone',
    metal: 'Diamond',
    purity: 'Natural Gemstone',
    grossWeight: 0.85,
    netWeight: 0.85,
    stoneWeight: 0.85,
    stoneValue: 28500,
    stoneType: 'Zambian Emerald (Panna)',
    stoneCarat: 3.86,
    labCertNo: 'Govt-GTL-98124',
    wastagePercentage: 0,
    makingChargeType: 'flat',
    makingChargeRate: 0,
    hsnCode: '7103',
    quantity: 2,
    minStockAlert: 1,
    barcode: 'SMJ2026007',
    description: 'Vivid green untreated natural astrological emerald with Govt Gemological Lab certificate.'
  },
  {
    id: 'item-08',
    tagNo: 'SMJ-2026-008',
    huid: 'GLD9K01',
    name: 'Modern Daily Wear 9K Gold Cocktail Ring',
    category: 'Rings',
    metal: 'Gold',
    purity: '9K',
    grossWeight: 3.80,
    netWeight: 3.50,
    stoneWeight: 0.30,
    stoneValue: 4200,
    stoneType: 'Swarovski Zirconia',
    wastagePercentage: 2.0,
    makingChargeType: 'flat',
    makingChargeRate: 1200,
    hsnCode: '7113',
    quantity: 7,
    minStockAlert: 2,
    barcode: 'SMJ2026008',
    description: 'Affordable youth collection 9K hallmarked gold studded band.'
  }
];

export const initialCustomers: Customer[] = [
  {
    id: 'cust-01',
    name: 'Smt. Sunita Sharma',
    phone: '9826012345',
    email: 'sunita.sharma@gmail.com',
    address: 'B-12, Danish Kunj, Kolar Road',
    city: 'Bhopal',
    state: 'Madhya Pradesh (23)',
    aadhaar: 'XXXX-XXXX-8921',
    totalPurchases: 285000,
    outstandingBalance: 0,
    createdAt: '2025-04-12'
  },
  {
    id: 'cust-02',
    name: 'Shri Rajeshwar Rao',
    phone: '9425098765',
    email: 'rajesh.rao@mp.gov.in',
    address: 'E-4/72, Arera Colony',
    city: 'Bhopal',
    state: 'Madhya Pradesh (23)',
    aadhaar: 'XXXX-XXXX-3412',
    totalPurchases: 450000,
    outstandingBalance: 12000,
    createdAt: '2025-06-20'
  },
  {
    id: 'cust-03',
    name: 'Smt. Kavita Chouhan',
    phone: '9179043210',
    address: 'M-14, Sarvdharm Colony, Kolar Road',
    city: 'Bhopal',
    state: 'Madhya Pradesh (23)',
    totalPurchases: 195000,
    outstandingBalance: 0,
    createdAt: '2025-09-05'
  }
];

export const initialKarigars: Karigar[] = [
  {
    id: 'kg-01',
    name: 'Gopal Soni (Bengali Artisan)',
    phone: '9893011223',
    address: 'Sarafa Bazar, Near Chowk, Old Bhopal',
    specialization: 'Hand Chhilai & Bridal Choker Sets',
    goldBalanceGram: 18.45,
    silverBalanceGram: 0,
    cashDue: 4200,
    activeJobsCount: 2
  },
  {
    id: 'kg-02',
    name: 'Babu Lal Verma (Jadau & Kundan)',
    phone: '9926077889',
    address: 'Lalwani Gali, Ibrahimpura, Bhopal',
    specialization: 'Jadau, Polki & Precious Stone Setting',
    goldBalanceGram: 8.20,
    silverBalanceGram: 45.0,
    cashDue: 2800,
    activeJobsCount: 1
  },
  {
    id: 'kg-03',
    name: 'Kallu Bhai (Silver Specialist)',
    phone: '9131055443',
    address: 'Bairagarh, Bhopal',
    specialization: 'Handcrafted Payal, Utensils & Moorti',
    goldBalanceGram: 0,
    silverBalanceGram: 120.50,
    cashDue: 1500,
    activeJobsCount: 1
  }
];

export const initialKarigarJobCards: KarigarJobCard[] = [
  {
    id: 'kjb-01',
    jobNo: 'KJB-2026-018',
    karigarId: 'kg-01',
    karigarName: 'Gopal Soni (Bengali Artisan)',
    issueDate: '2026-10-24',
    expectedDeliveryDate: '2026-11-02',
    status: 'In Progress',
    metal: 'Gold',
    purity: '22K',
    rawMetalIssuedWeight: 42.50,
    expectedPurityLossPercent: 2.5,
    itemDescription: 'Antique Peacock motif haar with handcrafted drops',
    laborRatePerGram: 420,
    totalLaborCharge: 17850,
    laborPaid: 5000,
    notes: 'Urgent wedding delivery. Customer wants antique polish.'
  },
  {
    id: 'kjb-02',
    jobNo: 'KJB-2026-019',
    karigarId: 'kg-02',
    karigarName: 'Babu Lal Verma (Jadau & Kundan)',
    issueDate: '2026-10-26',
    expectedDeliveryDate: '2026-11-04',
    status: 'Issued',
    metal: 'Gold',
    purity: '18K',
    rawMetalIssuedWeight: 14.20,
    expectedPurityLossPercent: 1.5,
    itemDescription: 'Emerald and diamond eternity band setting',
    laborRatePerGram: 550,
    totalLaborCharge: 7810,
    laborPaid: 0,
    notes: 'Emeralds supplied by shop.'
  }
];

export const initialGirviLoans: GirviLoan[] = [
  {
    id: 'grv-01',
    loanNo: 'GRV-2026-034',
    date: '2026-08-15',
    borrowerName: 'Mukesh Sharma',
    borrowerPhone: '9827011990',
    borrowerAddress: 'Nayapura, Kolar Road, Bhopal',
    borrowerAadhaar: 'XXXX-XXXX-7128',
    items: [
      {
        description: '22K Gold Chain with Om Locket',
        metal: 'Gold',
        purity: '22K',
        quantity: 1,
        grossWeight: 16.50,
        netWeight: 16.50,
        estimatedMarketRate: 6900,
        valuationAmount: 113850
      }
    ],
    totalGrossWeight: 16.50,
    totalNetWeight: 16.50,
    totalValuation: 113850,
    principalAmount: 75000,
    monthlyInterestRate: 1.75, // 1.75% per month
    tenureMonths: 12,
    status: 'Active',
    interestPaidSoFar: 2625,
    principalPaid: 0,
    balanceDue: 75000,
    notes: 'Safety packet sealed in Vault Locker No. 4.'
  },
  {
    id: 'grv-02',
    loanNo: 'GRV-2026-035',
    date: '2026-09-02',
    borrowerName: 'Anita Bai Vishwakarma',
    borrowerPhone: '9981033221',
    borrowerAddress: 'Gehun Kheda, Kolar Road, Bhopal',
    borrowerAadhaar: 'XXXX-XXXX-4410',
    items: [
      {
        description: 'Silver Payal + Silver Bichhiya',
        metal: 'Silver',
        purity: '925 Sterling',
        quantity: 2,
        grossWeight: 180.00,
        netWeight: 180.00,
        estimatedMarketRate: 85,
        valuationAmount: 15300
      }
    ],
    totalGrossWeight: 180.00,
    totalNetWeight: 180.00,
    totalValuation: 15300,
    principalAmount: 10000,
    monthlyInterestRate: 2.0,
    tenureMonths: 6,
    status: 'Active',
    interestPaidSoFar: 400,
    principalPaid: 0,
    balanceDue: 10000,
    notes: 'Vault Locker Silver Box B-12'
  }
];

export const initialInvoices: GSTInvoice[] = [
  {
    id: 'inv-01',
    invoiceNumber: 'SMJ-INV-2026-0042',
    invoiceType: 'GST_INVOICE',
    date: '2026-10-28',
    customerId: 'cust-01',
    customerName: 'Smt. Sunita Sharma',
    customerPhone: '9826012345',
    customerAddress: 'B-12, Danish Kunj, Kolar Road, Bhopal (MP)',
    customerGSTIN: '',
    placeOfSupply: 'Madhya Pradesh (23)',
    isInterState: false,
    profileId: 'prof-main',
    counterName: 'Main Retail Counter (Gold & Diamond)',
    items: [
      {
        tagNo: 'SMJ-2026-003',
        huid: 'SMJ916',
        name: 'Classic Antique Gold Bangles (Set of 2 - 22K)',
        category: 'Bangles',
        metal: 'Gold',
        purity: '22K',
        grossWeight: 32.50,
        netWeight: 32.50,
        stoneWeight: 0,
        stoneValue: 0,
        metalRateApplied: 6915,
        metalCost: 224737.5,
        wastagePercentage: 2.5,
        wastageCost: 5618.4,
        makingChargeType: 'per_gram',
        makingChargeRate: 420,
        makingCharge: 13650,
        huidCharge: 45,
        subtotal: 244050.9,
        hsnCode: '7113',
        quantity: 1
      }
    ],
    oldMetalExchange: {
      mode: 'weight_rate',
      metal: 'Gold',
      purity: '22K',
      grossWeight: 8.50,
      dustWastageGram: 0.35,
      meltPurityPercent: 91.6,
      netWeight: 8.15,
      ratePerGram: 6850,
      totalCreditAmount: 55827.5,
      description: 'Old 22K broken chain exchanged'
    },
    itemsSubtotal: 244050.9,
    oldMetalDeduction: 55827.5,
    taxableAmount: 188223.4,
    cgstRate: 1.5,
    sgstRate: 1.5,
    igstRate: 0,
    cgstAmount: 2823.35,
    sgstAmount: 2823.35,
    igstAmount: 0,
    totalTax: 5646.7,
    hallmarkingTotalFee: 45,
    discountAmount: 870.1,
    grandTotal: 193000,
    payment: {
      method: 'UPI/GPay',
      amountPaid: 193000,
      dueAmount: 0,
      transactionRef: 'UPI-SBI-92023578'
    },
    status: 'Paid',
    hallmarkCertified: true,
    notes: 'Hallmarked 6-Digit HUID: SMJ916.'
  }
];

export const initialCategories: string[] = [
  'Necklace',
  'Rings',
  'Bangles',
  'Earrings',
  'Chains',
  'Bracelets',
  'Coins & Bars',
  'Anklets (Payal)',
  'Pendants',
  'Mangalsutra',
  'Nath / Nose Pin',
  'Loose Gemstone',
  'Silver Utensil / Murti',
  'Bridal Choker Set',
  'Temple Heritage Jewellery',
  'Polki & Jadau'
];

export const initialVendors: Vendor[] = [
  {
    id: 'ven-01',
    firmName: 'Zaveri Bullion & Chains Pvt Ltd',
    contactPerson: 'Kantilal Zaveri',
    phone: '9820011445',
    email: 'sales@zaveribullion.com',
    address: '142, Sheikh Memon Street, Zaveri Bazaar',
    city: 'Mumbai',
    state: 'Maharashtra (27)',
    gstin: '27AABCZ9812M1Z4',
    pan: 'AABCZ9812M',
    goldBalanceOwed: 25.50, // 25.50g pure gold payable
    silverBalanceOwed: 0,
    cashBalanceDue: 145000,
    totalPurchasesAmount: 1850000,
    createdAt: '2025-01-15'
  },
  {
    id: 'ven-02',
    firmName: 'MP Gold Refinery & Hallmarking Centre',
    contactPerson: 'Suresh Soni',
    phone: '9425022334',
    address: 'Sarafa Bazar, Chowk',
    city: 'Bhopal',
    state: 'Madhya Pradesh (23)',
    gstin: '23AAMPS4421B1Z2',
    goldBalanceOwed: 0,
    silverBalanceOwed: 0,
    cashBalanceDue: 18500,
    totalPurchasesAmount: 920000,
    createdAt: '2025-03-10'
  },
  {
    id: 'ven-03',
    firmName: 'Agra Chandi Payal & Utensils Emporium',
    contactPerson: 'Mohan Lal Agarwal',
    phone: '9837099881',
    address: 'Johri Bazar',
    city: 'Agra',
    state: 'Uttar Pradesh (09)',
    gstin: '09AAACA3321A1Z9',
    goldBalanceOwed: 0,
    silverBalanceOwed: 250.0, // 250g silver balance
    cashBalanceDue: 35000,
    totalPurchasesAmount: 640000,
    createdAt: '2025-04-05'
  }
];

export const initialPurchases: PurchaseInvoice[] = [
  {
    id: 'pur-01',
    purchaseBillNo: 'PUR-2026-0015',
    vendorId: 'ven-01',
    vendorName: 'Kantilal Zaveri',
    vendorFirm: 'Zaveri Bullion & Chains Pvt Ltd',
    vendorGSTIN: '27AABCZ9812M1Z4',
    date: '2026-10-25',
    items: [
      {
        name: '22K Machine Cut Hollow Rope Chains',
        category: 'Chains',
        metal: 'Gold',
        purity: '22K',
        grossWeight: 52.40,
        netWeight: 52.40,
        ratePerGram: 6870,
        makingCharge: 180,
        stoneWeight: 0,
        stoneValue: 0,
        totalAmount: 369420,
        hsnCode: '7113',
        quantity: 5,
        huid: 'ZVR221',
        addToStock: true
      }
    ],
    totalGrossWeight: 52.40,
    totalNetWeight: 52.40,
    subtotal: 369420,
    gstRate: 3.0,
    gstAmount: 11082.6,
    grandTotal: 380502,
    paymentMode: 'Bank Transfer',
    amountPaid: 250000,
    balanceDue: 130502,
    fineGoldEquivalent: 48.0,
    notes: 'Inward shipment received via Brinks armored courier.'
  },
  {
    id: 'pur-02',
    purchaseBillNo: 'PUR-2026-0016',
    vendorId: 'ven-03',
    vendorName: 'Mohan Lal Agarwal',
    vendorFirm: 'Agra Chandi Payal & Utensils Emporium',
    vendorGSTIN: '09AAACA3321A1Z9',
    date: '2026-10-27',
    items: [
      {
        name: '925 Sterling Heavy Bridal Ghungroo Payal Lot',
        category: 'Anklets (Payal)',
        metal: 'Silver',
        purity: '925 Sterling',
        grossWeight: 450.0,
        netWeight: 450.0,
        ratePerGram: 83.5,
        makingCharge: 8,
        stoneWeight: 0,
        stoneValue: 0,
        totalAmount: 41175,
        hsnCode: '7113',
        quantity: 4,
        addToStock: true
      }
    ],
    totalGrossWeight: 450.0,
    totalNetWeight: 450.0,
    subtotal: 41175,
    gstRate: 3.0,
    gstAmount: 1235.25,
    grandTotal: 42410,
    paymentMode: 'UPI',
    amountPaid: 42410,
    balanceDue: 0,
    fineGoldEquivalent: 0,
    notes: 'Full payment cleared via Current Account UPI.'
  }
];

export const initialExpenses: ShopExpense[] = [
  {
    id: 'exp-01',
    voucherNo: 'EXP-2026-0041',
    date: '2026-10-26',
    category: 'Electricity & AC',
    amount: 6850,
    paymentSource: 'Bank Account',
    paidTo: 'MP Madhya Kshetra Vidyut Vitaran (MPEB)',
    notes: 'Kolar Road Showroom Electricity Bill'
  },
  {
    id: 'exp-02',
    voucherNo: 'EXP-2026-0042',
    date: '2026-10-27',
    category: 'Tea & Refreshment (चाय-नाश्ता)',
    amount: 1450,
    paymentSource: 'Cash in Hand',
    paidTo: 'Pandit Ji Chai & Snacks, Saideep Plaza',
    notes: 'Weekly store tea & customer refreshments'
  },
  {
    id: 'exp-03',
    voucherNo: 'EXP-2026-0043',
    date: '2026-10-28',
    category: 'Polish, Chhilai & Tools',
    amount: 3200,
    paymentSource: 'Cash in Hand',
    paidTo: 'Shree Krishna Tools & Buffing Works',
    notes: 'Ultrasonic jewelry cleaner solution + rouge polish compound'
  },
  {
    id: 'exp-04',
    voucherNo: 'EXP-2026-0044',
    date: '2026-10-29',
    category: 'Hallmarking & Testing Fees',
    amount: 2250,
    paymentSource: 'Bank Account',
    paidTo: 'Bhopal Assay & Hallmarking Center',
    notes: 'BIS HUID laser engraving fees for 50 items'
  }
];

export const initialCashInHand = 85400; // Physical cash in cash drawer
export const initialBankBalance = 425000; // SBI Current Account

export const initialTransfers: CashBankTransfer[] = [
  {
    id: 'trf-01',
    date: '2026-10-26',
    type: 'DEPOSIT_TO_BANK',
    amount: 50000,
    description: 'Cash excess deposited to SBI Kolar Road Current A/C'
  }
];

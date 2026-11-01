import React from 'react';
import { 
  ShoppingBag, 
  Package, 
  FileText, 
  Users, 
  BarChart3, 
  TrendingUp,
  Barcode, 
  Hammer, 
  Landmark, 
  Truck, 
  Building2, 
  ReceiptText, 
  Wallet,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Zap,
  FolderPlus,
  ArrowUpRight,
  Gem,
  Coins,
  X
} from 'lucide-react';
import { TabType } from './Navigation';
import { ShreemLogo } from './ShreemLogo';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  inventoryAlertCount: number;
  unpaidInvoicesCount: number;
  vendorDuesCount?: number;
  activeGirviCount?: number;
  activeKarigarJobsCount?: number;
  cashInHand?: number;
  bankBalance?: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenNewItem?: () => void;
  onOpenQuickGenerate?: () => void;
  onOpenCategoryModal?: () => void;
  customLogo?: string;
}

interface NavItem {
  id: TabType;
  label: string;
  hindiLabel: string;
  shortKey?: string;
  icon: React.ElementType;
  badge?: number | null;
  badgeColor?: string;
  badgeTitle?: string;
}

interface NavSection {
  title: string;
  hindiTitle: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  inventoryAlertCount,
  unpaidInvoicesCount,
  vendorDuesCount = 0,
  activeGirviCount = 0,
  activeKarigarJobsCount = 0,
  cashInHand = 0,
  bankBalance = 0,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenNewItem,
  onOpenQuickGenerate,
  onOpenCategoryModal,
  customLogo,
}) => {

  const sections: NavSection[] = [
    {
      title: 'Executive Desk',
      hindiTitle: 'मुख्य कार्यपालक डेस्क',
      items: [
        {
          id: 'dashboard',
          label: 'Swarnka ERP Dashboard',
          hindiLabel: 'व्यापार डैशबोर्ड',
          shortKey: 'F1',
          icon: BarChart3,
          badge: null
        }
      ]
    },
    {
      title: 'Sales & Inventory',
      hindiTitle: 'बिक्री व स्टॉक',
      items: [
        {
          id: 'pos',
          label: 'POS Sale Billing',
          hindiLabel: 'बिक्री काउंटर (टैक्स व कच्चा बिल)',
          shortKey: 'F2',
          icon: ShoppingBag,
          badge: null
        },
        {
          id: 'orders',
          label: 'Orders & Approval',
          hindiLabel: 'ग्राहक आर्डर व उछन्ती बिक्री',
          icon: FileText,
          badge: null
        },
        {
          id: 'purchases',
          label: 'Purchases (आवक)',
          hindiLabel: 'खरीद / माल आवक',
          shortKey: 'F3',
          icon: Truck,
          badge: null
        },
        {
          id: 'inventory',
          label: 'Stock Inventory',
          hindiLabel: 'स्टॉक (Pc/Tag/Loose/Dia)',
          shortKey: 'F4',
          icon: Package,
          badge: inventoryAlertCount > 0 ? inventoryAlertCount : null,
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
          badgeTitle: 'Low stock items'
        },
        {
          id: 'gemstones',
          label: 'Gemstones (रत्न)',
          hindiLabel: 'रत्न व नवरत्न डेस्क',
          shortKey: 'F10',
          icon: Gem,
          badge: null
        },
        {
          id: 'invoices',
          label: 'Sales Invoices',
          hindiLabel: 'बिक्री बिल रजिस्टर',
          icon: FileText,
          badge: unpaidInvoicesCount > 0 ? unpaidInvoicesCount : null,
          badgeColor: 'bg-rose-500 text-white font-bold',
          badgeTitle: 'Unpaid / Partial invoices'
        }
      ]
    },
    {
      title: 'Sarafa & Trading',
      hindiTitle: 'सराफा व ट्रेडिंग सेवाएं',
      items: [
        {
          id: 'bullion',
          label: 'Bullion Trading Desk',
          hindiLabel: 'सौदा व बदला ट्रेडिंग',
          icon: TrendingUp,
          badge: null
        },
        {
          id: 'kitty',
          label: 'Gold Kitty Scheme',
          hindiLabel: 'स्वर्ण बचत योजना (11+1)',
          icon: Coins,
          badge: null
        },
        {
          id: 'girvi',
          label: 'Girvi Ledger',
          hindiLabel: 'गिरवी खाता / लोन',
          shortKey: 'Alt+G',
          icon: Landmark,
          badge: activeGirviCount > 0 ? activeGirviCount : null,
          badgeColor: 'bg-emerald-500 text-slate-950 font-bold',
          badgeTitle: 'Active pawn loans'
        },
        {
          id: 'karigar',
          label: 'Karigar Ledger',
          hindiLabel: 'कारीगर / फाइन हिसाब',
          shortKey: 'F9',
          icon: Hammer,
          badge: activeKarigarJobsCount > 0 ? activeKarigarJobsCount : null,
          badgeColor: 'bg-cyan-500 text-slate-950 font-bold',
          badgeTitle: 'Active job orders'
        },
        {
          id: 'crm',
          label: 'CRM & Bulk SMS',
          hindiLabel: 'बल्क SMS, WhatsApp व विशेस',
          icon: Users,
          badge: null
        }
      ]
    },
    {
      title: 'Accounts & Khata',
      hindiTitle: 'रोकड़, खाता व पेरोल',
      items: [
        {
          id: 'payroll',
          label: 'Staff Salary & Payroll',
          hindiLabel: 'कर्मचारी वेतन व कमीशन',
          icon: Users,
          badge: null
        },
        {
          id: 'cashbank',
          label: 'Cash & Bank',
          hindiLabel: 'रोकड़ व बैंक हिसाब',
          shortKey: 'F5',
          icon: Wallet,
          badge: null
        },
        {
          id: 'expenses',
          label: 'Expenses',
          hindiLabel: 'दैनिक दुकान खर्चे',
          shortKey: 'F6',
          icon: ReceiptText,
          badge: null
        },
        {
          id: 'vendors',
          label: 'Vendors (Suppliers)',
          hindiLabel: 'सप्लायर खाता',
          shortKey: 'F7',
          icon: Building2,
          badge: vendorDuesCount > 0 ? vendorDuesCount : null,
          badgeColor: 'bg-rose-500 text-white font-bold',
          badgeTitle: 'Vendors with dues'
        },
        {
          id: 'customers',
          label: 'Customer Khata',
          hindiLabel: 'ग्राहक खाता / उधार',
          icon: Users,
          badge: null
        },
        {
          id: 'reports',
          label: 'Accounting Reports',
          hindiLabel: 'खाता बही, ट्रायल बैलेंस व GST',
          icon: BarChart3,
          badge: null
        },
        {
          id: 'profit',
          label: 'Profit & Margins',
          hindiLabel: 'मुनाफा व मार्जिन रिपोर्ट',
          shortKey: 'F11',
          icon: TrendingUp,
          badge: null
        }
      ]
    },
    {
      title: 'Tags & Printing',
      hindiTitle: 'टैगिंग व बारकोड',
      items: [
        {
          id: 'barcode',
          label: 'Barcode & QR Tags',
          hindiLabel: 'HUID टैग व गारंटी कार्ड',
          shortKey: 'F8',
          icon: Barcode,
          badge: null
        }
      ]
    }
  ];

  const handleItemClick = (id: TabType) => {
    onSelectTab(id);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 lg:static bg-white border-r border-stone-200 flex flex-col transition-all duration-300 ease-in-out shadow-lg shrink-0 ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        {/* Sidebar Header (Mobile & Brand info) */}
        <div className="p-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className={`flex items-center space-x-2.5 overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:justify-center w-full' : ''}`}>
            <ShreemLogo size="sm" showText={false} customLogo={customLogo} transparentBg={true} />
            {!isCollapsed && (
              <div className="leading-tight">
                <span className="text-sm font-black tracking-wide text-amber-600 block font-serif">
                  MAIN DESK
                </span>
                <span className="text-[10px] text-stone-500 font-medium block">
                  मुख्य मेन्यू व खाते
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 lg:hidden cursor-pointer"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse / expand button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 text-stone-500 hover:text-amber-600 hover:bg-stone-100 rounded-lg transition cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List - Scrollable */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 scrollbar-thin scrollbar-thumb-stone-200">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-2.5 pt-1 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                    {section.title}
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">
                    {section.hindiTitle}
                  </span>
                </div>
              ) : (
                <div className="h-px bg-slate-200 my-2 mx-2" />
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 group cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/20 text-slate-950 font-black border-l-4 border-amber-600 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      } ${isCollapsed ? 'justify-center !px-1.5' : ''}`}
                      title={item.label}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-amber-700' : 'text-slate-500 group-hover:text-slate-800'}`} />
                      {!isCollapsed && (
                        <div className="flex flex-col text-left truncate flex-1 min-w-0">
                          <span className={`text-xs leading-tight truncate ${isActive ? 'font-black text-slate-950' : 'font-extrabold text-slate-800'}`}>{item.label}</span>
                          <span className="text-[11px] text-slate-600 font-medium leading-tight truncate">{item.hindiLabel}</span>
                        </div>
                      )}
                      {!isCollapsed && item.shortKey && (
                        <span className="text-[9px] font-mono font-bold text-amber-900 px-1 py-0.5 rounded bg-amber-100/70 border border-amber-200 shrink-0">
                          {item.shortKey}
                        </span>
                      )}
                      {item.badge && !isCollapsed && (
                        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-stone-200 text-stone-700'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section: Quick Shortcuts & Live Balances */}
        <div className="p-3 border-t border-stone-100 bg-stone-50 space-y-2">
          {!isCollapsed ? (
            <>
              {/* Quick Actions Bar */}
              <div className="grid grid-cols-3 gap-1 pb-1">
                {onOpenNewItem && (
                  <button
                    onClick={onOpenNewItem}
                    className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 text-[10px] text-stone-700 hover:text-amber-700 transition cursor-pointer"
                    title="Add New Jewellery Stock Item"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-600 mb-0.5" />
                    <span className="font-medium">+ Item</span>
                  </button>
                )}
                {onOpenQuickGenerate && (
                  <button
                    onClick={onOpenQuickGenerate}
                    className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-200 text-[10px] text-amber-800 transition cursor-pointer"
                    title="1-Click Fast Stock Generator"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600 mb-0.5" />
                    <span className="font-bold">⚡ Fast</span>
                  </button>
                )}
                {onOpenCategoryModal && (
                  <button
                    onClick={onOpenCategoryModal}
                    className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 text-[10px] text-stone-700 hover:text-amber-700 transition cursor-pointer"
                    title="Manage Custom Categories"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-amber-600 mb-0.5" />
                    <span className="font-medium">+ Cat</span>
                  </button>
                )}
              </div>

              {/* Cash in Hand & Bank Mini Pill */}
              <div 
                onClick={() => handleItemClick('cashbank')}
                className="bg-white border border-stone-200 hover:border-amber-300 rounded-xl p-2.5 transition cursor-pointer group shadow-sm"
                title="Click to view Cash & Bank Dashboard"
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-stone-500 flex items-center gap-1 font-medium">
                    <Wallet className="w-3 h-3 text-amber-600" /> Cash:
                  </span>
                  <span className="font-mono font-bold text-stone-900 group-hover:text-amber-700">
                    ₹{cashInHand.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-500 flex items-center gap-1 font-medium">
                    <Landmark className="w-3 h-3 text-blue-600" /> Bank:
                  </span>
                  <span className="font-mono font-bold text-stone-900 group-hover:text-blue-700">
                    ₹{bankBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => handleItemClick('cashbank')}
                className="p-2 rounded-xl bg-stone-100 border border-stone-200 hover:border-amber-300 text-stone-600 hover:text-amber-700 transition cursor-pointer"
                title={`Cash: ₹${cashInHand.toLocaleString('en-IN')} | Bank: ₹${bankBalance.toLocaleString('en-IN')}`}
              >
                <Wallet className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

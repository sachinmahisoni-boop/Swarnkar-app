import React from 'react';
import { 
  ShoppingBag, 
  Package, 
  FileText, 
  Users, 
  BarChart3, 
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
}) => {

  const sections: NavSection[] = [
    {
      title: 'Sales & Inventory',
      hindiTitle: 'बिक्री व स्टॉक',
      items: [
        {
          id: 'pos',
          label: 'POS Sale',
          hindiLabel: 'बिक्री काउंटर',
          shortKey: 'F2',
          icon: ShoppingBag,
          badge: null
        },
        {
          id: 'purchases',
          label: 'Purchases',
          hindiLabel: 'खरीद / माल आवक',
          shortKey: 'F3',
          icon: Truck,
          badge: null
        },
        {
          id: 'inventory',
          label: 'Stock Inventory',
          hindiLabel: 'स्टॉक इन्वेंटरी',
          shortKey: 'F4',
          icon: Package,
          badge: inventoryAlertCount > 0 ? inventoryAlertCount : null,
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
          badgeTitle: 'Low stock items'
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
      title: 'Sarafa Services',
      hindiTitle: 'सराफा सेवाएं',
      items: [
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
          hindiLabel: 'कारीगर / जॉब वर्क',
          shortKey: 'F9',
          icon: Hammer,
          badge: activeKarigarJobsCount > 0 ? activeKarigarJobsCount : null,
          badgeColor: 'bg-cyan-500 text-slate-950 font-bold',
          badgeTitle: 'Active job orders'
        }
      ]
    },
    {
      title: 'Accounts & Khata',
      hindiTitle: 'रोकड़ व हिसाब',
      items: [
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
          label: 'Reports & GST',
          hindiLabel: 'खाता बही व रिपोर्ट्स',
          icon: BarChart3,
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
          hindiLabel: 'HUID टैग प्रिंटिंग',
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
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 lg:static bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out shadow-2xl shrink-0 ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        {/* Sidebar Header (Mobile & Brand info) */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className={`flex items-center space-x-2.5 overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:justify-center w-full' : ''}`}>
            <ShreemLogo size="sm" showText={false} />
            {!isCollapsed && (
              <div className="leading-tight">
                <span className="text-sm font-black tracking-wide text-amber-400 block font-serif">
                  MAIN DESK
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  मुख्य मेन्यू व खाते
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden cursor-pointer"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse / expand button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List - Scrollable */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-2.5 pt-1 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    {section.title}
                  </span>
                  <span className="text-[9px] text-amber-400/60 font-medium">
                    {section.hindiTitle}
                  </span>
                </div>
              ) : (
                <div className="h-px bg-slate-800 my-2 mx-2" />
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      title={`${item.label} (${item.hindiLabel})${item.shortKey ? ` [${item.shortKey}]` : ''}`}
                      className={`w-full group flex items-center rounded-xl transition-all duration-150 cursor-pointer ${
                        isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="relative shrink-0 flex items-center justify-center">
                        <Icon
                          className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-slate-950' : 'text-amber-400 group-hover:text-amber-300'
                          }`}
                        />
                        {/* Collapsed view badge indicator dot */}
                        {isCollapsed && item.badge && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900" />
                        )}
                      </div>

                      {!isCollapsed && (
                        <div className="ml-3 flex-1 flex items-center justify-between min-w-0">
                          <div className="truncate text-left leading-tight">
                            <span className="text-xs font-semibold block truncate">
                              {item.label}
                            </span>
                            <span className={`text-[10px] block truncate ${isActive ? 'text-slate-900/80 font-medium' : 'text-slate-400'}`}>
                              {item.hindiLabel}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0 ml-1.5">
                            {item.shortKey && (
                              <span
                                className={`text-[9px] font-mono px-1 py-0.5 rounded font-bold ${
                                  isActive
                                    ? 'bg-slate-950/20 text-slate-900'
                                    : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                                }`}
                              >
                                {item.shortKey}
                              </span>
                            )}

                            {item.badge && (
                              <span
                                title={item.badgeTitle}
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                                  item.badgeColor || 'bg-amber-500 text-slate-950'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section: Quick Shortcuts & Live Balances */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 space-y-2">
          {!isCollapsed ? (
            <>
              {/* Quick Actions Bar */}
              <div className="grid grid-cols-3 gap-1 pb-1">
                {onOpenNewItem && (
                  <button
                    onClick={onOpenNewItem}
                    className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-[10px] text-slate-300 hover:text-amber-300 transition cursor-pointer"
                    title="Add New Jewellery Stock Item"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                    <span className="font-medium">+ New Item</span>
                  </button>
                )}
                {onOpenQuickGenerate && (
                  <button
                    onClick={onOpenQuickGenerate}
                    className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] text-amber-300 transition cursor-pointer"
                    title="1-Click Fast Stock Generator"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                    <span className="font-bold">⚡ Fast Auto</span>
                  </button>
                )}
                {onOpenCategoryModal && (
                  <button
                    onClick={onOpenCategoryModal}
                    className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-[10px] text-slate-300 hover:text-amber-300 transition cursor-pointer"
                    title="Manage Custom Categories"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                    <span className="font-medium">+ Category</span>
                  </button>
                )}
              </div>

              {/* Cash in Hand & Bank Mini Pill */}
              <div 
                onClick={() => onSelectTab('cashbank')}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-xl p-2.5 transition cursor-pointer group"
                title="Click to view Cash & Bank Dashboard"
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400 flex items-center gap-1 font-medium">
                    <Wallet className="w-3 h-3 text-amber-400" /> Cash In Hand:
                  </span>
                  <span className="font-mono font-bold text-amber-400 group-hover:text-amber-300">
                    ₹{cashInHand.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1 font-medium">
                    <Landmark className="w-3 h-3 text-blue-400" /> Bank Deposit:
                  </span>
                  <span className="font-mono font-bold text-blue-300 group-hover:text-blue-200">
                    ₹{bankBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => onSelectTab('cashbank')}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 transition cursor-pointer"
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

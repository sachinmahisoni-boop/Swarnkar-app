import React from 'react';
import { MetalRate, ShopDetails, JewellerProfile } from '../types';
import { ShreemLogo } from './ShreemLogo';
import { 
  RefreshCw, 
  Bell, 
  Store, 
  Settings, 
  TrendingUp, 
  ShieldCheck, 
  Wallet, 
  Landmark, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  ArrowRightLeft,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

interface HeaderProps {
  shopDetails: ShopDetails;
  rates: MetalRate[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  activeProfile: JewellerProfile;
  cashInHand?: number;
  bankBalance?: number;
  onOpenProfilesModal: () => void;
  onOpenRatesModal: () => void;
  lowStockCount: number;
  onOpenStockAlertsModal: () => void;
  onOpenSettingsModal: () => void;
  onSelectTab: (tab: any) => void;
  onToggleMobileSidebar?: () => void;
  onToggleDesktopSidebar?: () => void;
  isDesktopSidebarCollapsed?: boolean;
  onLogout?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  shopDetails,
  rates,
  selectedCity,
  onSelectCity,
  activeProfile,
  cashInHand = 85400,
  bankBalance = 425000,
  onOpenProfilesModal,
  onOpenRatesModal,
  lowStockCount,
  onOpenStockAlertsModal,
  onOpenSettingsModal,
  onSelectTab,
  onToggleMobileSidebar,
  onToggleDesktopSidebar,
  isDesktopSidebarCollapsed = false,
  onLogout,
  theme = 'light',
  onToggleTheme,
}) => {
  const gold24k = rates.find(r => r.metal === 'Gold' && r.purity === '24K')?.ratePerGram || 0;
  const gold22k = rates.find(r => r.metal === 'Gold' && r.purity === '22K')?.ratePerGram || 0;
  const silver999 = rates.find(r => r.metal === 'Silver' && r.purity === '999 Fine')?.ratePerGram || 0;

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-stone-900 dark:text-slate-100 border-b border-stone-200 dark:border-slate-800 sticky top-0 z-30 font-sans shadow-xs transition-colors">
      
      {/* Top Utility Bar: Active Firm, Balances & Right-Aligned ERP Quick Tabs */}
      <div className="bg-stone-100/90 dark:bg-slate-950/80 border-b border-stone-200/80 dark:border-slate-800/80 px-2 sm:px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 text-stone-700 dark:text-slate-300">
        
        {/* Left: Mobile Trigger + Active Firm + Cash/Bank live balances */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-1.5 text-amber-800 dark:text-amber-400 hover:bg-stone-200 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Active Firm Selector Button */}
          <button
            onClick={onOpenProfilesModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-50/80 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-100 hover:text-amber-900 dark:hover:text-amber-300 border border-stone-300 dark:border-slate-700 hover:border-amber-400 font-bold transition cursor-pointer shadow-2xs group"
            title="फर्म बदलें या नई फर्म रजिस्टर करें (Click to Switch or Register Firm)"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Store className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="truncate max-w-[120px] sm:max-w-[220px] text-xs font-extrabold tracking-tight">
              {activeProfile.name}
            </span>
            <span className="text-[10px] bg-amber-500/15 dark:bg-amber-400/20 text-amber-900 dark:text-amber-300 font-black px-1.5 py-0.5 rounded-md border border-amber-300/40 uppercase">
              बदलें
            </span>
          </button>

          {/* Live Cash Indicator */}
          <button
            onClick={() => onSelectTab('cashbank')}
            className="hidden sm:flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-amber-50/60 dark:hover:bg-slate-700 border border-stone-300 dark:border-slate-700 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-stone-800 dark:text-slate-100 transition cursor-pointer shadow-2xs"
            title="Cash in Hand (हाथ में नकदी)"
          >
            <Wallet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>रोकड़: <strong className="text-amber-800 dark:text-amber-400">₹{cashInHand.toLocaleString('en-IN')}</strong></span>
          </button>

          {/* Live Bank Indicator */}
          <button
            onClick={() => onSelectTab('cashbank')}
            className="hidden sm:flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50/60 dark:hover:bg-slate-700 border border-stone-300 dark:border-slate-700 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-stone-800 dark:text-slate-100 transition cursor-pointer shadow-2xs"
            title="Bank Balance (बैंक बैलेंस)"
          >
            <Landmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>बैंक: <strong className="text-blue-800 dark:text-blue-400">₹{bankBalance.toLocaleString('en-IN')}</strong></span>
          </button>
        </div>

        {/* Right: ERP Shortcuts (Right-Hand Side as requested) */}
        <div className="ml-auto flex items-center gap-1 overflow-x-auto text-stone-700 dark:text-slate-300">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono pr-1.5 border-r border-stone-300 dark:border-slate-700 hidden md:inline">
            ERP MENU:
          </span>
          <button
            onClick={() => onSelectTab('pos')}
            className="hover:bg-white dark:hover:bg-slate-800 hover:text-amber-800 dark:hover:text-amber-300 px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-bold flex items-center gap-1 text-stone-700 dark:text-slate-300 hover:shadow-2xs"
          >
            <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-black bg-amber-100/70 dark:bg-amber-950/60 px-1 rounded">[F2]</span> POS Sale
          </button>
          <button
            onClick={() => onSelectTab('purchases')}
            className="hover:bg-white dark:hover:bg-slate-800 hover:text-amber-800 dark:hover:text-amber-300 px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-medium flex items-center gap-1 text-stone-700 dark:text-slate-300 hover:shadow-2xs"
          >
            <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-black bg-amber-100/70 dark:bg-amber-950/60 px-1 rounded">[F3]</span> Purchases
          </button>
          <button
            onClick={() => onSelectTab('inventory')}
            className="hover:bg-white dark:hover:bg-slate-800 hover:text-amber-800 dark:hover:text-amber-300 px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-medium flex items-center gap-1 text-stone-700 dark:text-slate-300 hover:shadow-2xs"
          >
            <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-black bg-amber-100/70 dark:bg-amber-950/60 px-1 rounded">[F4]</span> Stock
          </button>
          <button
            onClick={() => onSelectTab('gemstones')}
            className="hover:bg-white dark:hover:bg-slate-800 hover:text-amber-800 dark:hover:text-amber-300 px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-medium hidden sm:flex items-center gap-1 text-stone-700 dark:text-slate-300 hover:shadow-2xs"
          >
            <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-black bg-amber-100/70 dark:bg-amber-950/60 px-1 rounded">[F10]</span> Gems
          </button>
          <button
            onClick={() => onSelectTab('girvi')}
            className="hover:bg-white dark:hover:bg-slate-800 hover:text-emerald-800 dark:hover:text-emerald-300 px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-medium flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:shadow-2xs"
          >
            <span className="font-mono text-[10px] text-emerald-800 dark:text-emerald-300 font-black bg-emerald-100/70 dark:bg-emerald-950/60 px-1 rounded">[Alt+G]</span> Girvi
          </button>
          <button
            onClick={() => onSelectTab('karigar')}
            className="hover:bg-white dark:hover:bg-slate-800 hover:text-cyan-800 dark:hover:text-cyan-300 px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-medium hidden sm:flex items-center gap-1 text-cyan-700 dark:text-cyan-400 hover:shadow-2xs"
          >
            <span className="font-mono text-[10px] text-cyan-800 dark:text-cyan-300 font-black bg-cyan-100/70 dark:bg-cyan-950/60 px-1 rounded">[F9]</span> Karigar
          </button>
          <button
            onClick={() => onSelectTab('profit')}
            className="hover:bg-white dark:hover:bg-slate-800 hover:text-amber-800 dark:hover:text-amber-300 px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-bold hidden lg:flex items-center gap-1 text-amber-700 dark:text-amber-400 hover:shadow-2xs"
          >
            <span className="font-mono text-[10px] text-amber-800 dark:text-amber-300 font-black bg-amber-100/70 dark:bg-amber-950/60 px-1 rounded">[F11]</span> Profit
          </button>
        </div>

      </div>

      {/* Main Branding Bar with Luxury Logo & Financial Bullion Ticker */}
      <div className="w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Brand & Hallmarking Section */}
          <div className="flex items-center space-x-3.5">
            {onToggleDesktopSidebar && (
              <button
                onClick={onToggleDesktopSidebar}
                className="hidden lg:flex p-2 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-400 text-stone-600 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-400 transition cursor-pointer shadow-2xs"
                title="Toggle Sidebar"
              >
                {isDesktopSidebarCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}

            <ShreemLogo size="md" showText={true} customLogo={activeProfile.logoUrl || shopDetails.logoUrl} transparentBg={true} />

            <div className="hidden sm:block pl-3 border-l border-stone-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> BIS 916 HUID
                </span>
                <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-md border border-amber-300/60 dark:border-amber-700/60 font-bold">
                  GST: {activeProfile.gstin || shopDetails.gstin}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">
                {[shopDetails.address, shopDetails.cityStatePincode].filter(Boolean).join(', ') || 'Showroom Address'}
                {(activeProfile.phone || shopDetails.phone) ? ` | M: ${activeProfile.phone || shopDetails.phone}` : ''}
              </p>
            </div>
          </div>

          {/* Live Bullion Market Ticker */}
          <div className="flex flex-wrap items-center gap-2 bg-stone-50 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-stone-200 dark:border-slate-700 shadow-2xs">
            <div className="flex items-center gap-1.5 px-2 text-amber-800 dark:text-amber-400 font-bold border-r border-stone-200 dark:border-slate-700">
              <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs">Rates:</span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-1 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-stone-500 dark:text-slate-400 text-[11px] font-medium">24K:</span>
                <span className="font-extrabold text-stone-900 dark:text-slate-100 font-mono text-xs">₹{gold24k.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-stone-500 dark:text-slate-400 text-[11px] font-medium">22K:</span>
                <span className="font-extrabold text-amber-700 dark:text-amber-400 font-mono text-xs">₹{gold22k.toLocaleString('en-IN')}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <span className="text-stone-500 dark:text-slate-400 text-[11px] font-medium">Sil 999:</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-300 font-mono text-xs">₹{silver999.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={onOpenRatesModal}
              className="ml-auto bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 text-slate-950 font-black px-2.5 sm:px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Daily Rate Configurator"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Update Rates</span>
            </button>
          </div>

          {/* Theme Toggle, Alerts & Settings Icons */}
          <div className="flex items-center gap-2 justify-end">
            
            {/* Light / Dark Mode Switcher Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-amber-300 hover:text-amber-700 hover:border-amber-400 dark:hover:border-amber-400 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs"
                title={theme === 'dark' ? "Switch to Light Mode (लाइट मोड पर जाएं)" : "Switch to Dark Mode (डार्क मोड पर जाएं)"}
                aria-label="Toggle Light/Dark Theme"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300 text-xs font-black">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-700" />
                    <span className="text-stone-800 text-xs font-black">Dark Mode</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onOpenStockAlertsModal}
              className="relative p-2.5 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:border-amber-400 dark:hover:border-amber-400 transition cursor-pointer shadow-2xs"
              title="Stock Alerts"
            >
              <Bell className="w-4 h-4" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenSettingsModal}
              className="p-2.5 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:border-amber-400 dark:hover:border-amber-400 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
              title="Shop & Brand Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:border-rose-300 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs"
                title="Logout & Clear Session Cache"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

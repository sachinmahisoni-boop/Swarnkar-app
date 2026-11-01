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
  LogOut
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
}) => {
  const gold24k = rates.find(r => r.metal === 'Gold' && r.purity === '24K')?.ratePerGram || 0;
  const gold22k = rates.find(r => r.metal === 'Gold' && r.purity === '22K')?.ratePerGram || 0;
  const silver999 = rates.find(r => r.metal === 'Silver' && r.purity === '999 Fine')?.ratePerGram || 0;

  return (
    <header className="bg-white/95 backdrop-blur-md text-stone-900 border-b border-stone-200 sticky top-0 z-30 font-sans shadow-xs">
      
      {/* Top Utility Bar: Active Firm, Balances & Right-Aligned ERP Quick Tabs */}
      <div className="bg-stone-100/90 border-b border-stone-200/80 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2.5 text-stone-600">
        
        {/* Left: Mobile Trigger + Active Firm + Cash/Bank live balances */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-1.5 text-amber-800 hover:bg-stone-200 rounded-lg transition cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Active Firm Selector Button */}
          <button
            onClick={onOpenProfilesModal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-amber-50/80 text-stone-800 hover:text-amber-900 border border-stone-200 hover:border-amber-300 font-bold transition cursor-pointer shadow-2xs group"
            title="फर्म बदलें या नई फर्म रजिस्टर करें (Click to Switch or Register Firm)"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Store className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
            <span className="truncate max-w-[140px] sm:max-w-[220px] text-xs font-extrabold tracking-tight">
              {activeProfile.name}
            </span>
            <span className="text-[10px] bg-amber-500/15 text-amber-800 font-black px-1.5 py-0.5 rounded-md border border-amber-300/40 uppercase">
              बदलें
            </span>
          </button>

          {/* Live Cash Indicator */}
          <button
            onClick={() => onSelectTab('cashbank')}
            className="hidden sm:flex items-center gap-1.5 bg-white hover:bg-amber-50/60 border border-stone-200 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-stone-800 transition cursor-pointer shadow-2xs"
            title="Cash in Hand (हाथ में नकदी)"
          >
            <Wallet className="w-3.5 h-3.5 text-amber-600" />
            <span>रोकड़: <strong className="text-amber-800">₹{cashInHand.toLocaleString('en-IN')}</strong></span>
          </button>

          {/* Live Bank Indicator */}
          <button
            onClick={() => onSelectTab('cashbank')}
            className="hidden sm:flex items-center gap-1.5 bg-white hover:bg-blue-50/60 border border-stone-200 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-stone-800 transition cursor-pointer shadow-2xs"
            title="Bank Balance (बैंक बैलेंस)"
          >
            <Landmark className="w-3.5 h-3.5 text-blue-600" />
            <span>बैंक: <strong className="text-blue-800">₹{bankBalance.toLocaleString('en-IN')}</strong></span>
          </button>
        </div>

        {/* Right: ERP Shortcuts (Right-Hand Side as requested) */}
        <div className="ml-auto flex items-center gap-1 overflow-x-auto text-stone-700">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 font-mono pr-1.5 border-r border-stone-300 hidden md:inline">
            ERP MENU:
          </span>
          <button
            onClick={() => onSelectTab('pos')}
            className="hover:bg-white hover:text-amber-800 px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-bold flex items-center gap-1 text-stone-700 hover:shadow-2xs"
          >
            <span className="font-mono text-[10px] text-amber-700 font-black bg-amber-100/60 px-1 rounded">[F2]</span> POS Sale
          </button>
          <button
            onClick={() => onSelectTab('purchases')}
            className="hover:bg-white hover:text-amber-800 px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-medium flex items-center gap-1 text-stone-700 hover:shadow-2xs"
          >
            <span className="font-mono text-[10px] text-amber-700 font-black bg-amber-100/60 px-1 rounded">[F3]</span> Purchases
          </button>
          <button
            onClick={() => onSelectTab('inventory')}
            className="hover:bg-white hover:text-amber-800 px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-medium flex items-center gap-1 text-stone-700 hover:shadow-2xs"
          >
            <span className="font-mono text-[10px] text-amber-700 font-black bg-amber-100/60 px-1 rounded">[F4]</span> Stock
          </button>
          <button
            onClick={() => onSelectTab('gemstones')}
            className="hover:bg-white hover:text-amber-800 px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-medium hidden sm:flex items-center gap-1 text-stone-700 hover:shadow-2xs"
          >
            <span className="font-mono text-[10px] text-amber-700 font-black bg-amber-100/60 px-1 rounded">[F10]</span> Gems
          </button>
          <button
            onClick={() => onSelectTab('girvi')}
            className="hover:bg-white hover:text-emerald-800 px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-medium flex items-center gap-1 text-emerald-700 hover:shadow-2xs"
          >
            <span className="font-mono text-[10px] text-emerald-800 font-black bg-emerald-100/60 px-1 rounded">[Alt+G]</span> Girvi
          </button>
          <button
            onClick={() => onSelectTab('karigar')}
            className="hover:bg-white hover:text-cyan-800 px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-medium hidden sm:flex items-center gap-1 text-cyan-700 hover:shadow-2xs"
          >
            <span className="font-mono text-[10px] text-cyan-800 font-black bg-cyan-100/60 px-1 rounded">[F9]</span> Karigar
          </button>
          <button
            onClick={() => onSelectTab('profit')}
            className="hover:bg-white hover:text-amber-800 px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-bold hidden lg:flex items-center gap-1 text-amber-700 hover:shadow-2xs"
          >
            <span className="font-mono text-[10px] text-amber-800 font-black bg-amber-100/60 px-1 rounded">[F11]</span> Profit
          </button>
        </div>

      </div>

      {/* Main Branding Bar with Luxury Logo & Financial Bullion Ticker */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
          
          {/* Brand & Hallmarking Section */}
          <div className="flex items-center space-x-3.5">
            {onToggleDesktopSidebar && (
              <button
                onClick={onToggleDesktopSidebar}
                className="hidden lg:flex p-2 rounded-xl bg-stone-50 border border-stone-200 hover:border-amber-400 text-stone-600 hover:text-amber-800 transition cursor-pointer shadow-2xs"
                title="Toggle Sidebar"
              >
                {isDesktopSidebarCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}

            <ShreemLogo size="md" showText={true} customLogo={activeProfile.logoUrl || shopDetails.logoUrl} transparentBg={true} />

            <div className="hidden sm:block pl-3 border-l border-stone-200">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> BIS 916 HUID
                </span>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-mono px-2 py-0.5 rounded-md border border-amber-300/60 font-bold">
                  GST: {activeProfile.gstin || shopDetails.gstin}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">
                {[shopDetails.address, shopDetails.cityStatePincode].filter(Boolean).join(', ') || 'Showroom Address'}
                {(activeProfile.phone || shopDetails.phone) ? ` | M: ${activeProfile.phone || shopDetails.phone}` : ''}
              </p>
            </div>
          </div>

          {/* Live Bullion Market Ticker */}
          <div className="flex flex-wrap items-center gap-2 bg-stone-50 p-1.5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-1.5 px-2 text-amber-800 font-bold border-r border-stone-200">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span className="text-xs">Bullion Rates:</span>
            </div>

            <div className="flex items-center gap-3 px-1 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-stone-500 text-[11px] font-medium">Gold 24K:</span>
                <span className="font-extrabold text-stone-900 font-mono text-xs">₹{gold24k.toLocaleString('en-IN')}/g</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-stone-500 text-[11px] font-medium">Gold 22K:</span>
                <span className="font-extrabold text-amber-700 font-mono text-xs">₹{gold22k.toLocaleString('en-IN')}/g</span>
              </div>
              <div className="hidden md:flex items-center gap-1">
                <span className="text-stone-500 text-[11px] font-medium">Silver 999:</span>
                <span className="font-extrabold text-slate-700 font-mono text-xs">₹{silver999.toLocaleString('en-IN')}/g</span>
              </div>
            </div>

            <button
              onClick={onOpenRatesModal}
              className="ml-auto bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Daily Rate Configurator"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update Rates</span>
            </button>
          </div>

          {/* Alerts & Settings Icons */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={onOpenStockAlertsModal}
              className="relative p-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-amber-400 transition cursor-pointer shadow-2xs"
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
              className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-amber-400 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
              title="Shop & Brand Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs"
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

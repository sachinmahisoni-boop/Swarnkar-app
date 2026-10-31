import React from 'react';
import { MetalRate, ShopDetails, JewellerProfile } from '../types';
import { cityRatesPresets } from '../data/initialData';
import { ShreemLogo } from './ShreemLogo';
import { RefreshCw, Bell, Store, Settings, TrendingUp, ShieldCheck, MapPin, ChevronDown, Layers, Wallet, Landmark, Menu, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

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
}) => {
  const gold24k = rates.find(r => r.metal === 'Gold' && r.purity === '24K')?.ratePerGram || 0;
  const gold22k = rates.find(r => r.metal === 'Gold' && r.purity === '22K')?.ratePerGram || 0;
  const gold18k = rates.find(r => r.metal === 'Gold' && r.purity === '18K')?.ratePerGram || 0;
  const gold9k = rates.find(r => r.metal === 'Gold' && r.purity === '9K')?.ratePerGram || 0;
  const silver999 = rates.find(r => r.metal === 'Silver' && r.purity === '999 Fine')?.ratePerGram || 0;
  const silver925 = rates.find(r => r.metal === 'Silver' && r.purity === '925 Sterling')?.ratePerGram || 0;

  return (
    <header className="bg-white text-stone-900 border-b border-stone-200 shadow-sm sticky top-0 z-30 font-sans">
      
      {/* Top Classic Desktop ERP Menu & Shortcut Bar */}
      <div className="bg-stone-100 border-b border-stone-200 px-4 py-1 text-[11px] flex flex-wrap items-center justify-between gap-2 text-stone-600">
        <div className="flex items-center gap-1 overflow-x-auto">
          {/* Mobile Menu Button */}
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-1 mr-1 text-amber-700 hover:text-amber-800 hover:bg-stone-200 rounded transition cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <span className="font-bold text-amber-700 font-mono pr-2 border-r border-stone-300 uppercase">
            ERP:
          </span>
          <button
            onClick={() => onSelectTab('pos')}
            className="hover:text-amber-800 hover:bg-stone-200 px-2 py-0.5 rounded transition cursor-pointer"
            title="Press F2"
          >
            <span className="text-amber-700 font-mono font-bold">[F2]</span> POS
          </button>
          <button
            onClick={() => onSelectTab('purchases')}
            className="hover:text-amber-800 hover:bg-stone-200 px-2 py-0.5 rounded transition cursor-pointer"
            title="Press F3"
          >
            <span className="text-amber-700 font-mono font-bold">[F3]</span> Purchases
          </button>
          <button
            onClick={() => onSelectTab('inventory')}
            className="hover:text-amber-800 hover:bg-stone-200 px-2 py-0.5 rounded transition cursor-pointer"
            title="Press F4"
          >
            <span className="text-amber-700 font-mono font-bold">[F4]</span> Stock
          </button>
          <button
            onClick={() => onSelectTab('girvi')}
            className="hover:text-amber-800 hover:bg-stone-200 px-2 py-0.5 rounded transition cursor-pointer text-emerald-700"
            title="Open Girvi"
          >
            <span className="text-emerald-700 font-mono font-bold">[Alt+G]</span> Girvi
          </button>
          <button
            onClick={() => onSelectTab('karigar')}
            className="hover:text-amber-800 hover:bg-stone-200 px-2 py-0.5 rounded transition cursor-pointer text-cyan-700"
            title="Press F9"
          >
            <span className="text-cyan-700 font-mono font-bold">[F9]</span> Karigar
          </button>
        </div>

        {/* Live Cash/Bank Widget */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectTab('cashbank')}
            className="flex items-center gap-1.5 bg-amber-100/50 hover:bg-amber-200/50 border border-amber-300 text-amber-900 px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-amber-700" />
            <span>Cash: ₹{cashInHand.toLocaleString('en-IN')}</span>
          </button>

          <button
            onClick={() => onSelectTab('cashbank')}
            className="flex items-center gap-1.5 bg-blue-100/50 hover:bg-blue-200/50 border border-blue-300 text-blue-900 px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
          >
            <Landmark className="w-3.5 h-3.5 text-blue-700" />
            <span>Bank: ₹{bankBalance.toLocaleString('en-IN')}</span>
          </button>
        </div>
      </div>

      {/* Main Branding Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center space-x-3">
            {onToggleDesktopSidebar && (
              <button
                onClick={onToggleDesktopSidebar}
                className="hidden lg:flex p-1.5 rounded-lg bg-stone-100 border border-stone-200 hover:border-amber-500 text-stone-700 hover:text-amber-800 transition cursor-pointer"
              >
                {isDesktopSidebarCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
            <ShreemLogo size="md" showText={true} customLogo={activeProfile.logoUrl || shopDetails.logoUrl} transparentBg={true} />
            <div className="hidden sm:block pl-2 border-l border-stone-200">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-600 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> BIS Hallmark 916
                </span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-mono px-1.5 py-0.5 rounded border border-amber-300">
                  GST: {activeProfile.gstin}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                {shopDetails.address}, Bhopal - 462042 | M: +91 9202357851
              </p>
            </div>
          </div>

          {/* Metal Rates Ticker */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-stone-200 text-xs shadow-sm">
            <div className="flex items-center gap-1 px-1 text-amber-800 font-semibold border-r border-stone-200 pr-2">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px]">Rates:</span>
            </div>

            <div className="flex items-center gap-2 px-1 text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-stone-500 font-medium">24K:</span>
                <span className="font-bold text-stone-900 font-mono">₹{gold24k.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-stone-500 font-medium">22K:</span>
                <span className="font-bold text-stone-900 font-mono">₹{gold22k.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={onOpenRatesModal}
              className="ml-auto bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition shadow cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Rates</span>
            </button>
          </div>

          {/* Alerts & Settings */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={onOpenStockAlertsModal}
              className="relative p-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 transition cursor-pointer"
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
              className="p-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 transition cursor-pointer flex items-center gap-1 text-xs font-medium"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

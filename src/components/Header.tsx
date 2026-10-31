import React from 'react';
import { MetalRate, ShopDetails, JewellerProfile } from '../types';
import { cityRatesPresets } from '../data/initialData';
import { ShreemLogo } from './ShreemLogo';
import { RefreshCw, Bell, Store, Settings, TrendingUp, ShieldCheck, MapPin, User, ChevronDown, Layers, Wallet, Landmark, Truck, ReceiptText, Menu, Hammer, ChevronLeft, ChevronRight } from 'lucide-react';

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
    <header className="bg-slate-950 text-slate-100 border-b border-amber-500/30 shadow-2xl sticky top-0 z-30 font-sans">
      
      {/* Top Classic Desktop ERP Menu & Shortcut Bar */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-1 text-[11px] flex flex-wrap items-center justify-between gap-2 text-slate-300">
        <div className="flex items-center gap-1 overflow-x-auto">
          {/* Mobile Menu Button */}
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-1 mr-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded transition cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <span className="font-bold text-amber-400 font-mono pr-2 border-r border-slate-700 uppercase">
            ERP Menu:
          </span>
          <button
            onClick={() => onSelectTab('pos')}
            className="hover:text-amber-300 hover:bg-slate-800 px-2 py-0.5 rounded transition cursor-pointer"
            title="Press F2 to open POS Sales"
          >
            <span className="text-amber-400 font-mono font-bold">[F2]</span> POS Sale (बिक्री)
          </button>
          <button
            onClick={() => onSelectTab('purchases')}
            className="hover:text-amber-300 hover:bg-slate-800 px-2 py-0.5 rounded transition cursor-pointer"
            title="Press F3 to open Purchases"
          >
            <span className="text-amber-400 font-mono font-bold">[F3]</span> Purchases (खरीद)
          </button>
          <button
            onClick={() => onSelectTab('inventory')}
            className="hover:text-amber-300 hover:bg-slate-800 px-2 py-0.5 rounded transition cursor-pointer"
            title="Press F4 to open Stock Inventory"
          >
            <span className="text-amber-400 font-mono font-bold">[F4]</span> Stock
          </button>
          <button
            onClick={() => onSelectTab('girvi')}
            className="hover:text-amber-300 hover:bg-slate-800 px-2 py-0.5 rounded transition cursor-pointer text-emerald-300"
            title="Open Girvi (Pawn Loan Ledger)"
          >
            <span className="text-emerald-400 font-mono font-bold">[Alt+G]</span> Girvi (गिरवी)
          </button>
          <button
            onClick={() => onSelectTab('karigar')}
            className="hover:text-amber-300 hover:bg-slate-800 px-2 py-0.5 rounded transition cursor-pointer text-cyan-300"
            title="Press F9 to open Karigar Job Work"
          >
            <span className="text-cyan-400 font-mono font-bold">[F9]</span> Karigar (कारीगर)
          </button>
          <button
            onClick={() => onSelectTab('cashbank')}
            className="hover:text-amber-300 hover:bg-slate-800 px-2 py-0.5 rounded transition cursor-pointer"
            title="Press F5 to open Cash & Bank"
          >
            <span className="text-amber-400 font-mono font-bold">[F5]</span> Cash & Bank (रोकड़)
          </button>
          <button
            onClick={() => onSelectTab('expenses')}
            className="hover:text-amber-300 hover:bg-slate-800 px-2 py-0.5 rounded transition cursor-pointer"
            title="Press F6 to open Expenses"
          >
            <span className="text-amber-400 font-mono font-bold">[F6]</span> Expenses (खर्चे)
          </button>
          <button
            onClick={() => onSelectTab('vendors')}
            className="hover:text-amber-300 hover:bg-slate-800 px-2 py-0.5 rounded transition cursor-pointer"
            title="Press F7 to open Vendors"
          >
            <span className="text-amber-400 font-mono font-bold">[F7]</span> Vendors (सप्लायर)
          </button>
          <button
            onClick={() => onSelectTab('reports')}
            className="hover:text-amber-300 hover:bg-slate-800 px-2 py-0.5 rounded transition cursor-pointer"
            title="Open Daily Sales Report"
          >
            Daily Reports
          </button>
        </div>

        {/* Live Cash in Hand & Bank Balance Widget in Header Bar */}
        <div className="flex items-center gap-2">
          {/* Cash In Hand Pill */}
          <button
            onClick={() => onSelectTab('cashbank')}
            className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
            title="Physical Cash in Hand in Counter Drawer (Click to view Cash Ledger)"
          >
            <Wallet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Cash: ₹{cashInHand.toLocaleString('en-IN')}</span>
          </button>

          {/* Bank Balance Pill */}
          <button
            onClick={() => onSelectTab('cashbank')}
            className="flex items-center gap-1.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
            title="SBI Current Account Bank Balance (Click to view Bank Ledger)"
          >
            <Landmark className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Bank: ₹{bankBalance.toLocaleString('en-IN')}</span>
          </button>

          {/* Counter Switcher */}
          <button
            onClick={onOpenProfilesModal}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-0.5 rounded-lg border border-slate-700 font-medium transition cursor-pointer"
            title="Click to Switch Jeweller Counter / Profile"
          >
            <Layers className="w-3 h-3 text-amber-400" />
            <span className="font-bold">{activeProfile.counterName}</span>
            <ChevronDown className="w-3 h-3 text-amber-400 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Main ERP Dark Blue Header Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Shop Branding with official Golden Shree Logo & Sidebar toggle */}
          <div className="flex items-center space-x-3">
            {/* Desktop toggle button */}
            {onToggleDesktopSidebar && (
              <button
                onClick={onToggleDesktopSidebar}
                className="hidden lg:flex p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 transition cursor-pointer"
                title={isDesktopSidebarCollapsed ? "Expand Sidebar [Left Menu]" : "Collapse Sidebar [Left Menu]"}
              >
                {isDesktopSidebarCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
            {/* Mobile hamburger button */}
            {onToggleMobileSidebar && (
              <button
                onClick={onToggleMobileSidebar}
                className="lg:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300 transition cursor-pointer"
                title="Toggle Left Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <ShreemLogo size="md" showText={true} />
            <div className="hidden sm:block pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> BIS Hallmark 916 & 6-Digit HUID
                </span>
                <span className="bg-amber-500/10 text-amber-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-amber-500/20">
                  GST: {activeProfile.gstin}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {shopDetails.address}, Bhopal - 462042 | M: +91 9202357851
              </p>
            </div>
          </div>

          {/* Today's Live Metal Rates Bar & City Ticker */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs shadow-inner">
            
            {/* City Switcher Pill */}
            <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 px-2 py-1 rounded-lg text-amber-300 font-bold">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => onSelectCity(e.target.value)}
                className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer text-xs"
                title="Select City Bullion Market"
              >
                {cityRatesPresets.map(preset => (
                  <option key={preset.city} value={preset.city} className="bg-slate-900 text-slate-200">
                    {preset.city}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 px-1 text-amber-400 font-semibold border-r border-slate-800 pr-2">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[11px]" title="Live Bullion Feed from A To Z Bullion, Bhopal (atozbullion.com)">
                {selectedCity === 'Bhopal' ? 'A To Z Bullion:' : `${selectedCity} Sarafa:`}
              </span>
            </div>

            <div className="flex items-center gap-2 px-1 text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-amber-200 font-medium">24K:</span>
                <span className="font-bold text-amber-400 font-mono">₹{gold24k.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-amber-200 font-medium">22K (916):</span>
                <span className="font-bold text-amber-300 font-mono">₹{gold22k.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-1 hidden sm:flex">
                <span className="text-amber-200/80 font-medium">18K:</span>
                <span className="font-bold text-amber-200 font-mono">₹{gold18k.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-1 hidden md:flex">
                <span className="text-amber-200/60 font-medium">9K:</span>
                <span className="font-bold text-amber-200/80 font-mono">₹{gold9k.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-300 font-medium">Silver 999:</span>
                <span className="font-bold text-slate-100 font-mono">₹{silver999.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              id="btn-update-rates"
              onClick={onOpenRatesModal}
              className="ml-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition shadow cursor-pointer whitespace-nowrap"
              title="Edit / Configure Bullion Master Rates"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Rates</span>
            </button>
          </div>

          {/* Quick Header Actions: Alerts & Shop Settings */}
          <div className="flex items-center gap-2 justify-end">
            <button
              id="btn-stock-alerts"
              onClick={onOpenStockAlertsModal}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
              title="Low Stock Alerts"
            >
              <Bell className="w-4 h-4" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              id="btn-shop-settings"
              onClick={onOpenSettingsModal}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-xs font-medium"
              title="Store Details & GST Master [F10]"
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

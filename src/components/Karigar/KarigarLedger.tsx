import React, { useState } from 'react';
import { Karigar, KarigarJobCard, MetalType } from '../../types';
import { ShreemLogo } from '../ShreemLogo';
import { Hammer, Plus, Search, Calendar, Scale, CheckCircle2, Clock, AlertCircle, FileText, UserCheck, ArrowRight, Printer, X, Share2 } from 'lucide-react';
import { getISTDate } from '../../lib/invoiceNumber';

interface KarigarLedgerProps {
  karigars: Karigar[];
  jobCards: KarigarJobCard[];
  onAddJobCard: (card: KarigarJobCard) => void;
  onUpdateJobCard: (card: KarigarJobCard) => void;
  onAddKarigar: (karigar: Karigar) => void;
}

export const KarigarLedger: React.FC<KarigarLedgerProps> = ({
  karigars,
  jobCards,
  onAddJobCard,
  onUpdateJobCard,
  onAddKarigar,
}) => {
  const [selectedKarigarId, setSelectedKarigarId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'jobCards' | 'karigarList'>('jobCards');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [showNewKarigarModal, setShowNewKarigarModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedJobForReceive, setSelectedJobForReceive] = useState<KarigarJobCard | null>(null);
  const [printJobCard, setPrintJobCard] = useState<KarigarJobCard | null>(null);

  // New Job Form State
  const [formKarigarId, setFormKarigarId] = useState(karigars[0]?.id || '');
  const [formMetal, setFormMetal] = useState<MetalType>('Gold');
  const [formPurity, setFormPurity] = useState('22K');
  const [formIssuedWeight, setFormIssuedWeight] = useState<number>(20.0);
  const [formLossPercent, setFormLossPercent] = useState<number>(2.5); // 2.5% wastage allowance
  const [formItemDesc, setFormItemDesc] = useState('');
  const [formDeliveryDate, setFormDeliveryDate] = useState(
    getISTDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).isoDateStr
  );
  const [formLaborRate, setFormLaborRate] = useState<number>(450);
  const [formAdvanceLabor, setFormAdvanceLabor] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');

  // Receive Form State
  const [rcvGrossWeight, setRcvGrossWeight] = useState<number>(0);
  const [rcvStonesWeight, setRcvStonesWeight] = useState<number>(0);
  const [rcvScrapWeight, setRcvScrapWeight] = useState<number>(0);
  const [rcvLaborPaid, setRcvLaborPaid] = useState<number>(0);

  // New Karigar Form State
  const [newKgName, setNewKgName] = useState('');
  const [newKgPhone, setNewKgPhone] = useState('');
  const [newKgAddress, setNewKgAddress] = useState('');
  const [newKgSpec, setNewKgSpec] = useState('');

  // Filtering
  const filteredJobs = jobCards.filter(job => {
    const matchKarigar = selectedKarigarId === 'all' || job.karigarId === selectedKarigarId;
    const matchSearch = job.jobNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.karigarName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.itemDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matchKarigar && matchSearch;
  });

  // Aggregates
  const totalGoldIssued = jobCards
    .filter(j => j.metal === 'Gold' && j.status !== 'Settled')
    .reduce((sum, j) => sum + j.rawMetalIssuedWeight, 0);

  const totalSilverIssued = jobCards
    .filter(j => j.metal === 'Silver' && j.status !== 'Settled')
    .reduce((sum, j) => sum + j.rawMetalIssuedWeight, 0);

  const totalActiveJobs = jobCards.filter(j => j.status === 'Issued' || j.status === 'In Progress').length;
  const totalLaborPending = jobCards.reduce((sum, j) => sum + Math.max(0, j.totalLaborCharge - j.laborPaid), 0);

  // Submit New Job Card
  const handleCreateJobCard = (e: React.FormEvent) => {
    e.preventDefault();
    const kg = karigars.find(k => k.id === formKarigarId);
    if (!kg) return;

    const newJob: KarigarJobCard = {
      id: `kjb-${Date.now()}`,
      jobNo: `KJB-2026-${String(jobCards.length + 20).padStart(3, '0')}`,
      karigarId: kg.id,
      karigarName: kg.name,
      issueDate: getISTDate().isoDateStr,
      expectedDeliveryDate: formDeliveryDate,
      status: 'Issued',
      metal: formMetal,
      purity: formPurity,
      rawMetalIssuedWeight: Number(formIssuedWeight),
      expectedPurityLossPercent: Number(formLossPercent),
      itemDescription: formItemDesc,
      laborRatePerGram: Number(formLaborRate),
      totalLaborCharge: Math.round(Number(formIssuedWeight) * Number(formLaborRate)),
      laborPaid: Number(formAdvanceLabor),
      notes: formNotes
    };

    onAddJobCard(newJob);
    setShowNewJobModal(false);
    // Reset form
    setFormItemDesc('');
    setFormNotes('');
  };

  // Submit Receive Finished Ornament
  const handleReceiveOrnament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForReceive) return;

    const netReceived = rcvGrossWeight - rcvStonesWeight;
    const allowedLoss = (selectedJobForReceive.rawMetalIssuedWeight * (selectedJobForReceive.expectedPurityLossPercent / 100));
    const actualLoss = selectedJobForReceive.rawMetalIssuedWeight - (netReceived + rcvScrapWeight);

    const updatedJob: KarigarJobCard = {
      ...selectedJobForReceive,
      status: 'Received',
      receivedDate: getISTDate().isoDateStr,
      finishedOrnamentWeight: Number(rcvGrossWeight),
      stoneWeightAdded: Number(rcvStonesWeight),
      scrapReturnedWeight: Number(rcvScrapWeight),
      actualLossWeight: Math.max(0, actualLoss),
      wastageAllowedWeight: allowedLoss,
      totalLaborCharge: Math.round(netReceived * selectedJobForReceive.laborRatePerGram),
      laborPaid: selectedJobForReceive.laborPaid + Number(rcvLaborPaid),
    };

    onUpdateJobCard(updatedJob);
    setShowReceiveModal(false);
    setSelectedJobForReceive(null);
  };

  // Create new artisan
  const handleCreateKarigar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKgName.trim()) return;

    const newKg: Karigar = {
      id: `kg-${Date.now()}`,
      name: newKgName.trim(),
      phone: newKgPhone.trim(),
      address: newKgAddress.trim(),
      specialization: newKgSpec.trim() || 'General Goldsmithing',
      goldBalanceGram: 0,
      silverBalanceGram: 0,
      cashDue: 0,
      activeJobsCount: 0
    };

    onAddKarigar(newKg);
    setShowNewKarigarModal(false);
    setNewKgName('');
    setNewKgPhone('');
    setNewKgAddress('');
    setNewKgSpec('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Gold in Artisans Hands</p>
            <h3 className="text-xl font-black text-amber-300 font-mono">{totalGoldIssued.toFixed(2)} g</h3>
            <span className="text-[10px] text-amber-500/80">Issued for manufacturing</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-slate-700/40 text-slate-300 rounded-xl border border-slate-600/30">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Silver in Circulation</p>
            <h3 className="text-xl font-black text-slate-200 font-mono">{totalSilverIssued.toFixed(2)} g</h3>
            <span className="text-[10px] text-slate-400">Payal & utensils raw metal</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Job Cards</p>
            <h3 className="text-xl font-black text-blue-300 font-mono">{totalActiveJobs} Jobs</h3>
            <span className="text-[10px] text-blue-400/80">Pending finished receipt</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Hammer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Artisan Labor Payable</p>
            <h3 className="text-xl font-black text-emerald-300 font-mono">₹{totalLaborPending.toLocaleString('en-IN')}</h3>
            <span className="text-[10px] text-emerald-400/80">Making / chhilai dues</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Action Buttons */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          {/* Sub-tab switcher */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('jobCards')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${activeTab === 'jobCards' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Job Cards (कार्य पत्रक)
            </button>
            <button
              onClick={() => setActiveTab('karigarList')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${activeTab === 'karigarList' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Artisans Directory ({karigars.length})
            </button>
          </div>

          {/* Karigar Filter Dropdown */}
          <select
            value={selectedKarigarId}
            onChange={(e) => setSelectedKarigarId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Artisans (सभी कारीगर)</option>
            {karigars.map(k => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </select>

          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search job no, item or artisan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 w-56 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewKarigarModal(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-amber-400" />
            + New Artisan
          </button>
          <button
            onClick={() => setShowNewJobModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Issue Metal / Job Card
          </button>
        </div>
      </div>

      {/* Main Content: Job Cards Table OR Karigars Directory */}
      {activeTab === 'jobCards' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Job No & Date</th>
                  <th className="py-3 px-4">Artisan (कारीगर)</th>
                  <th className="py-3 px-4">Ornament Description</th>
                  <th className="py-3 px-4">Raw Metal Issued</th>
                  <th className="py-3 px-4">Touch / Loss %</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Labor Due</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No Karigar job cards found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map(job => (
                    <tr key={job.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-amber-300 block">{job.jobNo}</span>
                        <span className="text-[10px] text-slate-500">{job.issueDate}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {job.karigarName}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-200 line-clamp-1">{job.itemDescription}</p>
                        <span className="text-[10px] text-amber-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                          {job.purity} {job.metal}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-100 block">
                          {job.rawMetalIssuedWeight.toFixed(2)} g
                        </span>
                        <span className="text-[10px] text-slate-500">Pure weight</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-300">{job.expectedPurityLossPercent}%</span>
                        <span className="text-[10px] text-slate-500 block">
                          ~{((job.rawMetalIssuedWeight * job.expectedPurityLossPercent) / 100).toFixed(2)}g allowed
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        {job.expectedDeliveryDate}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          job.status === 'Received'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : job.status === 'In Progress'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {job.status === 'Received' && <CheckCircle2 className="w-3 h-3" />}
                          {job.status === 'In Progress' && <Clock className="w-3 h-3" />}
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-200 block">
                          ₹{(job.totalLaborCharge - job.laborPaid).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-500">Paid: ₹{job.laborPaid}</span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {job.status !== 'Received' && (
                          <button
                            onClick={() => {
                              setSelectedJobForReceive(job);
                              setRcvGrossWeight(job.rawMetalIssuedWeight * 0.98);
                              setShowReceiveModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg transition shadow-sm cursor-pointer"
                            title="Receive finished jewellery piece"
                          >
                            Receive Item
                          </button>
                        )}
                        <button
                          onClick={() => setPrintJobCard(job)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] border border-slate-700 transition cursor-pointer"
                          title="Print Job Voucher"
                        >
                          <Printer className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Karigars Directory Cards */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {karigars.map(kg => (
            <div key={kg.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-100 text-base">{kg.name}</h4>
                  <p className="text-xs text-amber-400 font-medium">{kg.specialization}</p>
                </div>
                <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-lg border border-slate-700 font-mono">
                  {kg.phone}
                </span>
              </div>

              <p className="text-xs text-slate-400">{kg.address}</p>

              <div className="grid grid-cols-2 gap-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Gold Balance Owed:</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">{kg.goldBalanceGram.toFixed(2)} g</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Silver Balance:</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">{kg.silverBalanceGram.toFixed(2)} g</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-400">Unsettled Labor:</span>
                <span className="font-mono font-bold text-emerald-400">₹{kg.cashDue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Issue Metal & New Job Card */}
      {showNewJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Hammer className="w-5 h-5 text-amber-400" /> Issue Raw Metal to Artisan
              </h3>
              <button onClick={() => setShowNewJobModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJobCard} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Select Karigar (कारीगर) *</label>
                <select
                  value={formKarigarId}
                  onChange={(e) => setFormKarigarId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                  required
                >
                  {karigars.map(k => (
                    <option key={k.id} value={k.id}>{k.name} ({k.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Metal Type *</label>
                  <select
                    value={formMetal}
                    onChange={(e) => setFormMetal(e.target.value as MetalType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Gold">Gold (सोना)</option>
                    <option value="Silver">Silver (चांदी)</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Purity (करात / टच) *</label>
                  <select
                    value={formPurity}
                    onChange={(e) => setFormPurity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="24K">24K (Pure Bullion)</option>
                    <option value="22K">22K (916 Standard)</option>
                    <option value="18K">18K (750 Diamond Setting)</option>
                    <option value="14K">14K (585 Light)</option>
                    <option value="9K">9K (375 Casual)</option>
                    <option value="999 Fine">Silver 999 Fine</option>
                    <option value="925 Sterling">Silver 925 Sterling</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Raw Metal Issued Weight (g) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={formIssuedWeight}
                    onChange={(e) => setFormIssuedWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Allowed Wastage / काट (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formLossPercent}
                    onChange={(e) => setFormLossPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Ornament Description / Design Spec *</label>
                <input
                  type="text"
                  placeholder="e.g. 22K Peacock Choker necklace with fine jali work"
                  value={formItemDesc}
                  onChange={(e) => setFormItemDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Target Delivery *</label>
                  <input
                    type="date"
                    value={formDeliveryDate}
                    onChange={(e) => setFormDeliveryDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Labor ₹ / gram</label>
                  <input
                    type="number"
                    value={formLaborRate}
                    onChange={(e) => setFormLaborRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Advance Paid (₹)</label>
                  <input
                    type="number"
                    value={formAdvanceLabor}
                    onChange={(e) => setFormAdvanceLabor(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewJobModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Issue Metal Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Receive Finished Ornament */}
      {showReceiveModal && selectedJobForReceive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-slate-100 text-base">Receive Finished Jewellery Piece</h3>
                <p className="text-xs text-amber-400">Job: {selectedJobForReceive.jobNo} | {selectedJobForReceive.karigarName}</p>
              </div>
              <button onClick={() => setShowReceiveModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveOrnament} className="space-y-4 mt-4 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block">Original Metal Issued:</span>
                <span className="text-base font-mono font-bold text-amber-300">
                  {selectedJobForReceive.rawMetalIssuedWeight.toFixed(2)} g ({selectedJobForReceive.purity} {selectedJobForReceive.metal})
                </span>
                <span className="text-[10px] text-slate-400 ml-2">
                  (Wastage allowance: {selectedJobForReceive.expectedPurityLossPercent}%)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Finished Gross Weight (g) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rcvGrossWeight}
                    onChange={(e) => setRcvGrossWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Stone / Pearl Weight (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rcvStonesWeight}
                    onChange={(e) => setRcvStonesWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Scrap / Chhilai Returned (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rcvScrapWeight}
                    onChange={(e) => setRcvScrapWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Pay Labor Now (₹)</label>
                  <input
                    type="number"
                    value={rcvLaborPaid}
                    onChange={(e) => setRcvLaborPaid(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Confirm Receipt & Update Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Artisan */}
      {showNewKarigarModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base">Add New Artisan (कारीगर)</h3>
              <button onClick={() => setShowNewKarigarModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKarigar} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Artisan Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Radheshyam Verma"
                  value={newKgName}
                  onChange={(e) => setNewKgName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Mobile Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9826012345"
                  value={newKgPhone}
                  onChange={(e) => setNewKgPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Specialization (काम की किस्म)</label>
                <input
                  type="text"
                  placeholder="e.g. Hand Chhilai, Jadau Kundan, Casting"
                  value={newKgSpec}
                  onChange={(e) => setNewKgSpec(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Workshop / Address</label>
                <input
                  type="text"
                  placeholder="e.g. Sarafa Chowk, Old Bhopal"
                  value={newKgAddress}
                  onChange={(e) => setNewKgAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewKarigarModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Artisan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Slip Modal */}
      {printJobCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <ShreemLogo size="sm" showText={true} />
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-700">JOB VOUCHER</span>
                <span className="block font-mono font-black text-amber-900">{printJobCard.jobNo}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Artisan: <strong>{printJobCard.karigarName}</strong></span>
                <span>Issue Date: <strong>{printJobCard.issueDate}</strong></span>
              </div>
              <div className="flex justify-between">
                <span>Ornament: <strong>{printJobCard.itemDescription}</strong></span>
                <span>Due Date: <strong>{printJobCard.expectedDeliveryDate}</strong></span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between font-mono">
                <div>
                  <span className="text-slate-600 block text-[10px]">Issued Metal:</span>
                  <span className="font-bold text-sm text-slate-900">{printJobCard.rawMetalIssuedWeight.toFixed(2)} g</span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px]">Purity:</span>
                  <span className="font-bold text-sm text-amber-800">{printJobCard.purity} {printJobCard.metal}</span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px]">Wastage Allowed:</span>
                  <span className="font-bold text-sm text-slate-900">{printJobCard.expectedPurityLossPercent}%</span>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <span>Labor Rate: ₹{printJobCard.laborRatePerGram}/g</span>
                <span>Advance Paid: ₹{printJobCard.laborPaid}</span>
              </div>
            </div>

            <div className="border-t pt-4 flex justify-between items-center text-xs">
              <div className="text-center">
                <div className="w-24 border-b border-slate-400 mb-1"></div>
                <span className="text-[10px] text-slate-500">Artisan Sign</span>
              </div>
              <div className="text-center">
                <div className="w-24 border-b border-slate-400 mb-1"></div>
                <span className="text-[10px] text-slate-500">Authorised Sign</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t print:hidden">
              <button
                onClick={() => setPrintJobCard(null)}
                className="px-4 py-1.5 bg-slate-200 text-slate-800 font-bold rounded-lg text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (!printJobCard) return;
                  const kg = karigars.find(k => k.id === printJobCard.karigarId);
                  const message = `*श्रीः | SHREEM MAHAL JEWELLERS, BHOPAL*\n*KARIGAR JOB VOUCHER (कारीगर पर्चा)*\n--------------------------------\nJob No: ${printJobCard.jobNo}\nKarigar: ${printJobCard.karigarName}\nItem: ${printJobCard.itemDescription}\nMetal: ${printJobCard.rawMetalIssuedWeight}g (${printJobCard.purity} ${printJobCard.metal})\nTouch Loss Allowance: ${printJobCard.expectedPurityLossPercent}%\nDelivery Date: ${printJobCard.expectedDeliveryDate}\nLabor Rate: ₹${printJobCard.laborRatePerGram}/g\n\nShop No 6, Ground Floor, Saideep Plaza, DK 2, Kolar, Bhopal - 462042\nMob: +91 9202357851`;
                  const cleanPhone = (kg?.phone || '').replace(/[^0-9]/g, '');
                  const url = cleanPhone ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
                  window.open(url, '_blank');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition"
                title="Send Job Slip to Karigar WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" /> WhatsApp
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

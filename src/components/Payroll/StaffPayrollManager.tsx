import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Printer, 
  FileText, 
  Award, 
  Percent, 
  Briefcase 
} from 'lucide-react';

export interface StaffEmployee {
  id: string;
  code: string;
  name: string;
  role: 'Senior Sales Incharge' | 'Sales Executive' | 'Cashier' | 'Jewellery Appraiser' | 'Inventory Store Manager';
  phone: string;
  monthlyBaseSalary: number;
  salesCommissionPercent: number; // e.g. 0.5% or 1.0% on ornaments sold
  monthlySalesAchieved: number;
  workingDaysPresent: number;
  totalWorkingDays: number;
  advanceDeduction: number;
  netPayableSalary: number;
  status: 'Active' | 'On Leave';
}

export const StaffPayrollManager: React.FC = () => {
  const [staff, setStaff] = useState<StaffEmployee[]>([
    {
      id: 'emp-01',
      code: 'EMP-BPL-01',
      name: 'Shri Sachin Soni',
      role: 'Senior Sales Incharge',
      phone: '9202357851',
      monthlyBaseSalary: 45000,
      salesCommissionPercent: 0.5,
      monthlySalesAchieved: 2056030,
      workingDaysPresent: 26,
      totalWorkingDays: 26,
      advanceDeduction: 5000,
      netPayableSalary: 50280, // 45000 + 10280 - 5000
      status: 'Active'
    },
    {
      id: 'emp-02',
      code: 'EMP-BPL-02',
      name: 'Smt. Shanti Bisht',
      role: 'Sales Executive',
      phone: '9826019823',
      monthlyBaseSalary: 28000,
      salesCommissionPercent: 0.75,
      monthlySalesAchieved: 1394651,
      workingDaysPresent: 25,
      totalWorkingDays: 26,
      advanceDeduction: 2000,
      netPayableSalary: 36460,
      status: 'Active'
    },
    {
      id: 'emp-03',
      code: 'EMP-BPL-03',
      name: 'Shri Anand Soni',
      role: 'Jewellery Appraiser',
      phone: '9425044120',
      monthlyBaseSalary: 32000,
      salesCommissionPercent: 0.25,
      monthlySalesAchieved: 1203175,
      workingDaysPresent: 26,
      totalWorkingDays: 26,
      advanceDeduction: 0,
      netPayableSalary: 35008,
      status: 'Active'
    },
    {
      id: 'emp-04',
      code: 'EMP-BPL-04',
      name: 'Smt. Bobby Kumari',
      role: 'Sales Executive',
      phone: '9179088192',
      monthlyBaseSalary: 25000,
      salesCommissionPercent: 0.75,
      monthlySalesAchieved: 954559,
      workingDaysPresent: 24,
      totalWorkingDays: 26,
      advanceDeduction: 1500,
      netPayableSalary: 30659,
      status: 'Active'
    }
  ]);

  const [selectedStaffSlip, setSelectedStaffSlip] = useState<StaffEmployee | null>(null);

  return (
    <div className="space-y-4 text-slate-800">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>कर्मचारी वेतन व पेरोल प्रबंधन (Staff Salary & Salesman Payroll)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Biometric attendance, base salary computation, sales commission bonus, and salary slips
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-indigo-50 text-indigo-900 font-bold px-3 py-1.5 rounded-lg border border-indigo-200">
            Total Staff: {staff.length} Active
          </span>
        </div>
      </div>

      {/* Salary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-300 rounded-xl p-3.5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Monthly Gross Salary</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
            ₹{staff.reduce((s, e) => s + e.monthlyBaseSalary, 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500">Base Salary Pool</span>
        </div>

        <div className="bg-white border border-slate-300 rounded-xl p-3.5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Sales Commission Earned</span>
          <p className="text-2xl font-black text-emerald-800 font-mono mt-0.5">
            ₹{Math.round(staff.reduce((s, e) => s + (e.monthlySalesAchieved * (e.salesCommissionPercent / 100)), 0)).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium">Incentives on ₹56.08L Store Sales</span>
        </div>

        <div className="bg-white border border-slate-300 rounded-xl p-3.5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Net Monthly Payout (नेट वेतन)</span>
          <p className="text-2xl font-black text-indigo-950 font-mono mt-0.5">
            ₹{staff.reduce((s, e) => s + e.netPayableSalary, 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500">Bank Transfer & Cash Salary Ready</span>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm">Employee Roster & Monthly Payroll Ledger</h3>
          <span className="text-xs text-slate-500 font-medium">Month: October - November 2026</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Emp ID</th>
                <th className="p-2.5">Staff Name</th>
                <th className="p-2.5">Designation</th>
                <th className="p-2.5 text-center">Attendance</th>
                <th className="p-2.5 text-right">Base Salary</th>
                <th className="p-2.5 text-right">Sales Achieved</th>
                <th className="p-2.5 text-right">Comm. (₹)</th>
                <th className="p-2.5 text-right">Adv. Deduct</th>
                <th className="p-2.5 text-right">Net Payable</th>
                <th className="p-2.5 text-center">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {staff.map((emp) => {
                const commission = Math.round(emp.monthlySalesAchieved * (emp.salesCommissionPercent / 100));

                return (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-indigo-900">{emp.code}</td>
                    <td className="p-2.5 font-sans font-bold text-slate-900">{emp.name}</td>
                    <td className="p-2.5 font-sans text-slate-600 font-medium">{emp.role}</td>
                    <td className="p-2.5 text-center font-bold text-slate-700">
                      {emp.workingDaysPresent} / {emp.totalWorkingDays} days
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      ₹{emp.monthlyBaseSalary.toLocaleString('en-IN')}
                    </td>
                    <td className="p-2.5 text-right text-slate-600">
                      ₹{emp.monthlySalesAchieved.toLocaleString('en-IN')}
                    </td>
                    <td className="p-2.5 text-right font-bold text-emerald-800">
                      +₹{commission.toLocaleString('en-IN')} ({emp.salesCommissionPercent}%)
                    </td>
                    <td className="p-2.5 text-right text-rose-700">
                      {emp.advanceDeduction > 0 ? `-₹${emp.advanceDeduction.toLocaleString('en-IN')}` : '₹0'}
                    </td>
                    <td className="p-2.5 text-right font-black text-indigo-950 text-sm">
                      ₹{emp.netPayableSalary.toLocaleString('en-IN')}
                    </td>
                    <td className="p-2.5 text-center font-sans">
                      <button
                        onClick={() => setSelectedStaffSlip(emp)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded font-bold text-[11px] cursor-pointer"
                      >
                        Print Slip
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Slip Print Modal */}
      {selectedStaffSlip && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">मासिक वेतन पर्ची (Monthly Salary Payslip)</h3>
              <button onClick={() => setSelectedStaffSlip(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="border-b border-slate-200 pb-2">
                <h4 className="font-extrabold text-sm text-slate-900">Shreem Mahal Jewellers ERP</h4>
                <p className="text-[11px] text-slate-500">Kolar Road, Bhopal (MP) • Employee Salary Statement</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>कर्मचारी नाम: <strong>{selectedStaffSlip.name}</strong></div>
                <div>कोड: <strong className="font-mono">{selectedStaffSlip.code}</strong></div>
                <div>पद: <strong>{selectedStaffSlip.role}</strong></div>
                <div>उपस्थिति: <strong className="font-mono">{selectedStaffSlip.workingDaysPresent} / 26 दिन</strong></div>
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>मूल वेतन (Base Salary):</span>
                  <span>₹{selectedStaffSlip.monthlyBaseSalary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>बिक्री कमीशन (Sales Incentive):</span>
                  <span>+₹{Math.round(selectedStaffSlip.monthlySalesAchieved * (selectedStaffSlip.salesCommissionPercent / 100)).toLocaleString('en-IN')}</span>
                </div>
                {selectedStaffSlip.advanceDeduction > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>अग्रिम कटौती (Advance Deduct):</span>
                    <span>-₹{selectedStaffSlip.advanceDeduction.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-300 pt-1 font-black text-slate-900 text-sm">
                  <span>कुल देय वेतन (Net Payable):</span>
                  <span>₹{selectedStaffSlip.netPayableSalary.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedStaffSlip(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Payslip</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

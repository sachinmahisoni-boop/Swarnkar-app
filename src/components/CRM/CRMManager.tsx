import React, { useState } from 'react';
import { Customer, GSTInvoice } from '../../types';
import { 
  Users, 
  MessageSquare, 
  Mail, 
  Send, 
  Gift, 
  Calendar, 
  Sparkles, 
  Award, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Search, 
  Copy, 
  Smartphone 
} from 'lucide-react';

interface CRMManagerProps {
  customers: Customer[];
  invoices: GSTInvoice[];
}

export const CRMManager: React.FC<CRMManagerProps> = ({ customers, invoices }) => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'wishes' | 'loyalty'>('campaigns');
  const [selectedTemplate, setSelectedTemplate] = useState('welcome');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // CRM Campaign Templates
  const templates = [
    {
      id: 'welcome',
      title: 'Welcome SMS for Daily Visitors (दैनिक आगंतुक स्वागत संदेश)',
      type: 'Visitor Welcome',
      message: 'नमस्ते {Customer_Name} जी, श्री महाल ज्वैलर्स में पधारने के लिए आपका हार्दिक धन्यवाद! 100% BIS 916 हॉलमार्क सोने व चांदी के आभूषणों के नए कलेक्शन के लिए संपर्क करें: 9202357851।'
    },
    {
      id: 'birthday',
      title: 'Birthday & Anniversary Wishes with 10% Making Off (जन्मदिन व वर्षगांठ शुभकामना)',
      type: 'Personal Greetings',
      message: 'जन्मदिन / वैवाहिक वर्षगांठ की हार्दिक शुभकामनाएं {Customer_Name} जी! आपके इस विशेष अवसर पर श्री महाल ज्वैलर्स की ओर से मेकिंग चार्ज पर विशेष 10% छूट का उपहार। विजिट करें: कोलार रोड, भोपाल।'
    },
    {
      id: 'ready_order',
      title: 'Ready Order & Repair Notification (आभूषण तैयार होने की सूचना)',
      type: 'Service Alert',
      message: 'प्रिय {Customer_Name} जी, आपका आभूषण / रिपेयर कार्य पूरी शुद्धता के साथ तैयार हो चुका है। कृपया दुकान पर आकर अपना आभूषण प्राप्त करें। धन्यवाद - श्री महाल ज्वैलर्स (9202357851)।'
    },
    {
      id: 'dues_reminder',
      title: 'Outstanding Payment Ledger Reminder (खाता बकाया भुगतान स्मरण)',
      type: 'Khata Reminder',
      message: 'आदरणीय {Customer_Name} जी, आपके खाते का बकाया ₹{Amount_Due} का भुगतान सादर अपेक्षित है। UPI/Cash द्वारा भुगतान करने के लिए संपर्क करें: 9202357851।'
    },
    {
      id: 'festival_gold',
      title: 'Dhanteras & Akshaya Tritiya Bullion Launch (धनतेरस व अक्षय तृतीया निमंत्रण)',
      type: 'Festive Offer',
      message: 'शुभ धनतेरस व अक्षय तृतीया पर श्री महाल ज्वैलर्स लेकर आए हैं 0% मेकिंग चार्ज पर 24K व 22K सोने के शुद्ध सिक्के व नए ब्राइडल सेट। आज ही पधारें!'
    }
  ];

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSendWhatsApp = (phone: string, msg: string) => {
    const clean = phone.replace(/\D/g, '');
    window.open(`https://wa.me/91${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-4 text-slate-800">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <span>CRM व बल्क SMS / WhatsApp सेवा (Jewellery CRM & Promotions)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Send automatic welcome greetings, birthday wishes, ready order SMS, and loyalty reward points
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'campaigns' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            SMS / WhatsApp Templates
          </button>
          <button
            onClick={() => setActiveTab('wishes')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'wishes' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Today's Birthday & Anniversary
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'loyalty' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Loyalty Points & Cards
          </button>
        </div>
      </div>

      {/* Tab: Campaigns & Templates */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl, i) => (
            <div 
              key={tpl.id}
              className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs space-y-2.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                    {tpl.type}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Template #{i + 1}</span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">{tpl.title}</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 font-sans mt-2 select-text leading-relaxed">
                  "{tpl.message}"
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  onClick={() => handleCopyMessage(tpl.message, i)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedIndex === i ? 'Copied!' : 'Copy Template'}</span>
                </button>

                <button
                  onClick={() => {
                    const sample = customers[0] || { name: 'Customer', phone: '9202357851' };
                    const text = tpl.message.replace('{Customer_Name}', sample.name).replace('{Amount_Due}', '12,500');
                    handleSendWhatsApp(sample.phone, text);
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Test WhatsApp</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Birthday & Anniversary Wishes */}
      {activeTab === 'wishes' && (
        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-rose-500" />
              <span>Upcoming Customer Birthdays & Anniversaries (आगामी जन्मदिन व सालगिरह)</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Automatic reminders for loyalty retention</span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Customer Name</th>
                  <th className="p-2.5">Phone Number</th>
                  <th className="p-2.5">Occasion</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Total Lifetime Purchases</th>
                  <th className="p-2.5 text-right">Send Greeting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.slice(0, 5).map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                    <td className="p-2.5 font-mono text-slate-600">{c.phone}</td>
                    <td className="p-2.5">
                      <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold text-[11px] border border-rose-200">
                        {idx % 2 === 0 ? '🎂 Birthday' : '💍 Wedding Anniversary'}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-slate-800">
                      {idx === 0 ? 'Today (01 Nov)' : idx === 1 ? 'Tomorrow (02 Nov)' : '05 Nov'}
                    </td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">
                      ₹{(c.totalPurchases || 285000).toLocaleString('en-IN')}
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => {
                          const msg = `हार्दिक शुभकामनाएं ${c.name} जी! श्री महाल ज्वैलर्स की ओर से आपके विशेष दिन पर विशेष 10% मेकिंग छूट का उपहार। विजिट करें: कोलार रोड, भोपाल (9202357851)।`;
                          handleSendWhatsApp(c.phone, msg);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Wish on WhatsApp</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Loyalty Points */}
      {activeTab === 'loyalty' && (
        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Customer Membership & Loyalty Points (ग्राहक रिवॉर्ड व लॉयल्टी अंक)</span>
            </h3>
            <span className="text-xs text-amber-900 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              Rule: ₹1,000 Purchase = 1 Reward Point (₹10 Redemption Value)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {customers.map((c) => {
              const points = Math.floor((c.totalPurchases || 100000) / 1000);
              const tier = points > 300 ? 'Platinum Member' : points > 150 ? 'Gold Member' : 'Silver Member';

              return (
                <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">{c.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tier === 'Platinum Member' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                      tier === 'Gold Member' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      'bg-slate-200 text-slate-800'
                    }`}>
                      {tier}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    <div>मोबाइल: <strong className="font-mono">{c.phone}</strong></div>
                    <div>कुल खरीदारी: <strong className="font-mono text-slate-900">₹{(c.totalPurchases || 0).toLocaleString('en-IN')}</strong></div>
                    <div>उपलब्ध रिवॉर्ड अंक: <strong className="text-purple-700 font-mono text-sm">{points} pts</strong> (₹{points * 10})</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

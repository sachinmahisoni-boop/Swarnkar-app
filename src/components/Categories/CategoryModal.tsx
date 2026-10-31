import React, { useState } from 'react';
import { Layers, Plus, Trash2, X, Tag, Sparkles, Check } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onAddCategory: (categoryName: string) => void;
  onDeleteCategory: (categoryName: string) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const popularSuggestions = [
    'Bridal Choker Set',
    'Temple Heritage Jewellery',
    'Polki & Jadau',
    'Antique Rajwadi Haar',
    'Italian Lightweight Gold',
    'Solitaire Diamond Jewellery',
    'Rose Gold Collection',
    'Silver Puja Bartan & Moorti',
    'Kids Nazariya & Bracelets',
    'Mens Kada & Chains'
  ];

  const handleAdd = (nameToAdd: string) => {
    const trimmed = nameToAdd.trim();
    if (!trimmed) return;
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`Category "${trimmed}" already exists.`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    onAddCategory(trimmed);
    setNewCatName('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Jewellery Item Categories (आभूषण श्रेणियां)
              </h3>
              <p className="text-xs text-slate-400">Add or manage custom jewellery categories for your showroom</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Input */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">Add New Category Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Temple Jewellery or Bridal Choker"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd(newCatName);
                }
              }}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => handleAdd(newCatName)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {errorMsg && <p className="text-[11px] text-rose-400 font-medium">{errorMsg}</p>}
        </div>

        {/* Quick Suggestions */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Quick Add Suggestions:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {popularSuggestions.filter(s => !categories.includes(s)).slice(0, 6).map(s => (
              <button
                key={s}
                onClick={() => handleAdd(s)}
                className="text-[11px] bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 px-2.5 py-1 rounded-lg border border-slate-700/80 transition cursor-pointer flex items-center gap-1"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* Existing Categories List */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Existing Categories ({categories.length})</span>
            <span>Click red bin to remove</span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-xs text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium">{cat}</span>
                </span>
                <button
                  onClick={() => onDeleteCategory(cat)}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                  title="Remove category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

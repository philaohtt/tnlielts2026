import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  X,
  Settings2,
  List,
  Grid,
  Eye,
  Split
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import ConfirmationModal from '@/src/components/common/ConfirmationModal';

interface MatchingEditorProps {
  data: any;
  onSave: (newData: any) => void;
  onCancel: () => void;
}

export default function MatchingEditor({ data, onSave, onCancel }: MatchingEditorProps) {
  const [safe, setSafe] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'item' | 'option', idx: number } | null>(null);

  useEffect(() => {
    setSafe({
      numbering: data?.numbering || '',
      instructions: data?.instructions || '',
      prompt: data?.prompt || '',
      inlineSlots: false, 
      allowReuse: data?.allowReuse ?? false,
      config: {
        showLetters: data?.config?.showLetters ?? true,
        shuffleRight: data?.config?.shuffleRight ?? false,
        optionsInColumn: data?.config?.optionsInColumn ?? false,
        optionsHugContent: data?.config?.optionsHugContent ?? true,
        itemColumnTitle: data?.config?.itemColumnTitle || 'Items',
        optionColumnTitle: data?.config?.optionColumnTitle || 'Options'
      },
      items: Array.isArray(data?.items) ? data.items.map((i: any) => ({...i})) : [],
      options: Array.isArray(data?.options) ? data.options.map((o: any) => ({...o})) : [],
      answerKey: data?.answerKey || {} 
    });
  }, [data]);

  const handleUpdateItem = (idx: number, field: string, value: any) => {
    const newItems = [...safe.items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setSafe({ ...safe, items: newItems });
  };

  const handleUpdateOption = (idx: number, field: string, value: any) => {
    const newOptions = [...safe.options];
    newOptions[idx] = { ...newOptions[idx], [field]: value };
    setSafe({ ...safe, options: newOptions });
  };

  const addItem = () => {
    setSafe({
      ...safe,
      items: [...safe.items, { text: '', key: '' }]
    });
  };

  const addOption = () => {
    setSafe({
      ...safe,
      options: [...safe.options, { text: '' }]
    });
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'item') {
      const newItems = safe.items.filter((_: any, i: number) => i !== deleteConfirm.idx);
      setSafe({ ...safe, items: newItems });
    } else {
      const newOptions = safe.options.filter((_: any, i: number) => i !== deleteConfirm.idx);
      setSafe({ ...safe, options: newOptions });
    }
    setDeleteConfirm(null);
  };

  if (!safe) return null;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <header className="h-14 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel}
            className="p-1.5 hover:bg-[#f1f5f9] rounded-lg text-[#64748b] transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="h-6 w-[1px] bg-[#e2e8f0]" />
          <h2 className="font-bold text-[#1e293b]">Edit Matching</h2>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              showPreview ? "bg-[#eff6ff] text-[#2563eb]" : "text-[#64748b] hover:bg-[#f1f5f9]"
            )}
          >
            <Split size={14} />
            <span>{showPreview ? "Hide Preview" : "Show Preview"}</span>
          </button>
          <button 
            onClick={() => onSave(safe)}
            className="bg-[#2563eb] text-white px-6 py-1.5 rounded-lg text-xs font-bold hover:bg-[#1d4ed8] transition-all shadow-sm"
          >
            Save Block
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-hidden flex flex-row">
        {/* EDITOR SIDE */}
        <div className={cn(
          "flex flex-col h-full p-6 transition-all duration-300",
          showPreview ? "w-1/2 border-r border-[#e2e8f0]" : "w-full max-w-5xl mx-auto"
        )}>
          <div className="flex flex-col h-full space-y-6">
            {/* SETTINGS */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-6 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 size={16} className="text-[#64748b]" />
                  <h3 className="text-sm font-bold text-[#1e293b]">General Info</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Numbering</label>
                    <input 
                      type="text"
                      value={safe.numbering}
                      onChange={(e) => setSafe({ ...safe, numbering: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Instructions</label>
                    <input 
                      type="text"
                      value={safe.instructions}
                      onChange={(e) => setSafe({ ...safe, instructions: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Prompt (Optional)</label>
                  <textarea 
                    value={safe.prompt}
                    onChange={(e) => setSafe({ ...safe, prompt: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all min-h-[60px] resize-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Grid size={16} className="text-[#64748b]" />
                  <h3 className="text-sm font-bold text-[#1e293b]">Layout & Behavior</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Items Column Title</label>
                    <input 
                      type="text"
                      value={safe.config.itemColumnTitle}
                      onChange={(e) => setSafe({ ...safe, config: { ...safe.config, itemColumnTitle: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Options Bank Title</label>
                    <input 
                      type="text"
                      value={safe.config.optionColumnTitle}
                      onChange={(e) => setSafe({ ...safe, config: { ...safe.config, optionColumnTitle: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { id: 'allowReuse', label: 'Reuse Options' },
                    { id: 'showLetters', label: 'Show Letters', config: true },
                    { id: 'optionsInColumn', label: 'Vertical Bank', config: true },
                    { id: 'optionsHugContent', label: 'Hug Content', config: true },
                  ].map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={opt.config ? safe.config[opt.id] : safe[opt.id]}
                        onChange={(e) => {
                          if (opt.config) {
                            setSafe({ ...safe, config: { ...safe.config, [opt.id]: e.target.checked } });
                          } else {
                            setSafe({ ...safe, [opt.id]: e.target.checked });
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-[#cbd5e1] text-[#2563eb] focus:ring-[#2563eb]"
                      />
                      <span className="text-[10px] font-bold text-[#64748b] uppercase group-hover:text-[#1e293b] transition-colors">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
            {/* ITEMS LIST */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="px-6 py-3 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2">
                  <List size={16} className="text-[#64748b]" />
                  <span className="text-xs font-bold text-[#1e293b]">Items & Keys</span>
                </div>
                <button 
                  onClick={addItem}
                  className="p-1 hover:bg-white rounded-lg text-[#2563eb] transition-all border border-transparent hover:border-[#e2e8f0]"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="p-4 space-y-2 overflow-y-auto flex-grow">
                {safe.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
                    <span className="text-xs font-bold text-[#64748b] w-4 shrink-0 text-center">{idx + 1}</span>
                    <input 
                      type="text"
                      value={item.text}
                      onChange={(e) => handleUpdateItem(idx, 'text', e.target.value)}
                      placeholder="Item text"
                      className="flex-grow min-w-0 bg-white border border-[#e2e8f0] px-3 py-1.5 rounded-lg text-sm outline-none focus:border-[#2563eb] transition-all"
                    />
                    <input 
                      type="text"
                      value={item.key}
                      onChange={(e) => handleUpdateItem(idx, 'key', e.target.value.toUpperCase())}
                      placeholder="A"
                      className="w-10 shrink-0 bg-white border border-[#e2e8f0] px-2 py-1.5 rounded-lg text-sm text-center font-bold outline-none focus:border-[#2563eb] transition-all"
                    />
                    <button 
                      onClick={() => setDeleteConfirm({ type: 'item', idx })}
                      className="p-1 shrink-0 text-[#cbd5e1] hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* OPTIONS LIST */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="px-6 py-3 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2">
                  <Grid size={16} className="text-[#64748b]" />
                  <span className="text-xs font-bold text-[#1e293b]">Options Bank</span>
                </div>
                <button 
                  onClick={addOption}
                  className="p-1 hover:bg-white rounded-lg text-[#2563eb] transition-all border border-transparent hover:border-[#e2e8f0]"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="p-4 space-y-2 overflow-y-auto flex-grow">
                {safe.options.map((opt: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
                    <span className="text-xs font-bold text-[#64748b] w-4 shrink-0 text-center">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input 
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleUpdateOption(idx, 'text', e.target.value)}
                      placeholder="Option text"
                      className="flex-grow min-w-0 bg-white border border-[#e2e8f0] px-3 py-1.5 rounded-lg text-sm outline-none focus:border-[#2563eb] transition-all"
                    />
                    <button 
                      onClick={() => setDeleteConfirm({ type: 'option', idx })}
                      className="p-1 shrink-0 text-[#cbd5e1] hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PREVIEW SIDE */}
        {showPreview && (
          <div className="w-1/2 h-full bg-white overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <Eye size={18} className="text-[#2563eb]" />
                <h3 className="text-sm font-bold text-[#1e293b] uppercase tracking-wider">Candidate Preview</h3>
              </div>
              
              <div className="space-y-8">
                <div>
                  <div className="text-xs font-bold text-[#2563eb] mb-1">{safe.numbering}</div>
                  <h4 className="text-lg font-bold text-[#1e293b] mb-4">{safe.instructions}</h4>
                  
                  {safe.prompt && (
                    <p className="text-[#1e293b] mb-6 italic">{safe.prompt}</p>
                  )}

                  <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{safe.config.optionColumnTitle}</h5>
                    <div className={cn(
                      "flex flex-wrap gap-3",
                      safe.config.optionsInColumn && "flex-col"
                    )}>
                      {safe.options.map((opt: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                          <span className="font-bold text-[#2563eb]">{String.fromCharCode(65 + idx)}</span>
                          <span className="text-sm text-slate-700">{opt.text || '(Empty option)'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{safe.config.itemColumnTitle}</h5>
                    {safe.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="flex gap-3">
                          <span className="font-bold text-[#1e293b]">{idx + 1}.</span>
                          <span className="text-sm text-[#1e293b]">{item.text || '(Empty item)'}</span>
                        </div>
                        <div className="w-12 h-8 border-2 border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center font-bold text-[#2563eb]">
                          {/* Placeholder for input */}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ConfirmationModal 
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteConfirm?.type === 'item' ? 'Item' : 'Option'}?`}
        message={`Are you sure you want to delete this ${deleteConfirm?.type === 'item' ? 'item' : 'option'}? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  X,
  Settings2,
  Image as ImageIcon,
  Type,
  Hash,
  Maximize2,
  Move,
  Eye,
  Split
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import ConfirmationModal from '@/src/components/common/ConfirmationModal';

interface MapLabelingEditorProps {
  type: string;
  data: any;
  onSave: (newData: any) => void;
  onCancel: () => void;
}

function GapAnswersInput({ answers, onChange }: { answers: string[], onChange: (newAnswers: string[]) => void }) {
  const [inputValue, setInputValue] = useState(answers.join('; '));

  useEffect(() => {
    const current = answers.join('; ');
    if (current !== inputValue && !inputValue.endsWith(';') && !inputValue.endsWith('; ')) {
      setInputValue(current);
    }
  }, [answers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (!val.endsWith(';') && !val.endsWith('; ')) {
      const split = val.split(';').map(s => s.trim()).filter(s => s);
      onChange(split);
    }
  };

  const handleBlur = () => {
    const split = inputValue.split(';').map(s => s.trim()).filter(s => s);
    onChange(split);
    setInputValue(split.join('; '));
  };

  return (
    <input 
      type="text"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onClick={(e) => e.stopPropagation()}
      placeholder="Answers (sep by ;)"
      className="w-full px-2 py-1 rounded border border-[#e2e8f0] text-xs outline-none focus:border-[#2563eb]"
    />
  );
}

export default function MapLabelingEditor({ type, data, onSave, onCancel }: MapLabelingEditorProps) {
  const [safe, setSafe] = useState<any>(null);
  const [editorMode, setEditorMode] = useState<'gap' | 'text'>('gap');
  const [activeGapId, setActiveGapId] = useState<string | null>(null);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'gap' | 'text' } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<any>(null);
  const wasDragging = useRef(false);

  useEffect(() => {
    // Normalize data
    const defaultGap = {
      x: 0.05, y: 0.05, w: 0.12, h: 0.07,
      answers: [''],
      caseSensitive: false,
      style: { showNumberInside: true, opacity: 0.7, fontSize: 16 }
    };
    const defaultText = {
      x: 0.5, y: 0.5, w: 0.2, h: 0.05, text: 'Label...',
      fontSize: 14, color: '#111', bold: true,
      align: 'left'
    };

    const gaps = Array.isArray(data?.gaps) ? data.gaps.map((g: any, i: number) => ({
      id: g.id || 'g' + Math.random().toString(36).substr(2, 5),
      n: i + 1,
      x: g.x ?? defaultGap.x,
      y: g.y ?? defaultGap.y,
      w: g.w ?? defaultGap.w,
      h: g.h ?? defaultGap.h,
      answers: Array.isArray(g.answers) ? [...g.answers] : [''],
      caseSensitive: !!g.caseSensitive,
      style: {
        showNumberInside: g.style?.showNumberInside ?? defaultGap.style.showNumberInside,
        opacity: g.style?.opacity ?? defaultGap.style.opacity,
        fontSize: g.style?.fontSize ?? defaultGap.style.fontSize,
      }
    })) : [];

    const texts = Array.isArray(data?.texts) ? data.texts.map((t: any) => ({
      id: t.id || 't' + Math.random().toString(36).substr(2, 5),
      x: t.x ?? defaultText.x,
      y: t.y ?? defaultText.y,
      w: t.w ?? defaultText.w,
      h: t.h ?? defaultText.h,
      text: t.text || defaultText.text,
      fontSize: t.fontSize ?? defaultText.fontSize,
      color: t.color || defaultText.color,
      bold: t.bold ?? defaultText.bold,
      align: t.align || defaultText.align,
    })) : [];

    setSafe({
      numbering: data?.numbering || 'Questions 1-6',
      instructions: data?.instructions || 'Label the plan below.',
      image: data?.image || { dataUrl: null },
      gaps,
      texts
    });
  }, [data]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSafe({ ...safe, image: { dataUrl: reader.result }, gaps: [], texts: [] });
    };
    reader.readAsDataURL(file);
  };

  const addGap = (x: number, y: number) => {
    const id = 'g' + Math.random().toString(36).substr(2, 5);
    const newGap = {
      id, n: safe.gaps.length + 1,
      x: x - 0.06, y: y - 0.035, w: 0.12, h: 0.07,
      answers: [''], caseSensitive: false,
      style: { showNumberInside: true, opacity: 0.7, fontSize: 16 }
    };
    setSafe({ ...safe, gaps: [...safe.gaps, newGap] });
    setActiveGapId(id);
    setActiveTextId(null);
  };

  const addText = (x: number, y: number) => {
    const id = 't' + Math.random().toString(36).substr(2, 5);
    const newText = {
      id, x: x - 0.1, y: y - 0.025, w: 0.2, h: 0.05,
      text: 'Label...', fontSize: 14, color: '#111',
      bold: true, align: 'left'
    };
    setSafe({ ...safe, texts: [...safe.texts, newText] });
    setActiveTextId(id);
    setActiveGapId(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!containerRef.current || dragState.current || wasDragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (editorMode === 'gap') addGap(x, y);
    else addText(x, y);
  };

  const startDrag = (e: React.MouseEvent, id: string, type: 'gap' | 'text', mode: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'gap') { setActiveGapId(id); setActiveTextId(null); }
    else { setActiveTextId(id); setActiveGapId(null); }

    const item = type === 'gap' ? safe.gaps.find((g: any) => g.id === id) : safe.texts.find((t: any) => t.id === id);
    if (!item) return;

    dragState.current = {
      id, type, mode,
      startX: e.clientX, startY: e.clientY,
      startRelX: item.x, startRelY: item.y,
      startW: item.w, startH: item.h
    };

    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', endDrag);
  };

  const onDrag = (e: MouseEvent) => {
    if (!dragState.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragState.current.startX) / rect.width;
    const dy = (e.clientY - dragState.current.startY) / rect.height;

    const { id, type, mode } = dragState.current;

    if (type === 'gap') {
      const newGaps = safe.gaps.map((g: any) => {
        if (g.id !== id) return g;
        if (mode === 'move') {
          return { ...g, x: Math.max(0, Math.min(1 - g.w, dragState.current.startRelX + dx)), y: Math.max(0, Math.min(1 - g.h, dragState.current.startRelY + dy)) };
        } else {
          return { ...g, w: Math.max(0.02, Math.min(1 - g.x, dragState.current.startW + dx)), h: Math.max(0.02, Math.min(1 - g.y, dragState.current.startH + dy)) };
        }
      });
      setSafe((prev: any) => ({ ...prev, gaps: newGaps }));
    } else {
      const newTexts = safe.texts.map((t: any) => {
        if (t.id !== id) return t;
        if (mode === 'move') {
          return { ...t, x: Math.max(0, Math.min(1 - t.w, dragState.current.startRelX + dx)), y: Math.max(0, Math.min(1 - t.h, dragState.current.startRelY + dy)) };
        } else {
          return { ...t, w: Math.max(0.02, Math.min(1 - t.x, dragState.current.startW + dx)), h: Math.max(0.02, Math.min(1 - t.y, dragState.current.startH + dy)) };
        }
      });
      setSafe((prev: any) => ({ ...prev, texts: newTexts }));
    }
  };

  const endDrag = () => {
    if (dragState.current) {
      wasDragging.current = true;
      setTimeout(() => { wasDragging.current = false; }, 50);
    }
    dragState.current = null;
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', endDrag);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    if (type === 'gap') {
      const newGaps = safe.gaps.filter((g: any) => g.id !== id).map((g: any, i: number) => ({ ...g, n: i + 1 }));
      setSafe({ ...safe, gaps: newGaps });
      if (activeGapId === id) setActiveGapId(null);
    } else {
      const newTexts = safe.texts.filter((t: any) => t.id !== id);
      setSafe({ ...safe, texts: newTexts });
      if (activeTextId === id) setActiveTextId(null);
    }
    setDeleteConfirm(null);
  };

  if (!safe) return null;

  const activeGap = safe.gaps.find((g: any) => g.id === activeGapId);
  const activeText = safe.texts.find((t: any) => t.id === activeTextId);

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
          <h2 className="font-bold text-[#1e293b]">Edit {type === 'gap_fill_visual' ? 'Gap Fill Visual' : 'Map Labeling'}</h2>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              showPreview ? "bg-[#eff6ff] text-[#2563eb]" : "text-[#64748b] hover:bg-[#f1f5f9]"
            )}
          >
            <Eye size={14} />
            <span>{showPreview ? "Exit Preview" : "Preview"}</span>
          </button>
          <button 
            onClick={() => onSave(safe)}
            className="bg-[#2563eb] text-white px-6 py-1.5 rounded-lg text-xs font-bold hover:bg-[#1d4ed8] transition-all shadow-sm"
          >
            Save Block
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-hidden flex flex-col p-8">
        <div className="max-w-[1400px] mx-auto w-full flex flex-col h-full space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 flex-grow">
            {/* LEFT SIDEBAR - SETTINGS */}
            <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto pr-2">
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 size={16} className="text-[#64748b]" />
                  <h3 className="text-sm font-bold text-[#1e293b]">Settings</h3>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Numbering</label>
                    <input 
                      type="text"
                      value={safe.numbering}
                      onChange={(e) => setSafe({ ...safe, numbering: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Instructions</label>
                    <input 
                      type="text"
                      value={safe.instructions}
                      onChange={(e) => setSafe({ ...safe, instructions: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Map Image</label>
                    <button 
                      onClick={() => document.getElementById('map-up')?.click()}
                      className="w-full py-2 border border-dashed border-[#cbd5e1] rounded-lg text-xs font-bold text-[#64748b] hover:bg-[#f8fafc] transition-all flex items-center justify-center gap-2"
                    >
                      <ImageIcon size={14} />
                      <span>{safe.image.dataUrl ? 'Change Image' : 'Upload Image'}</span>
                    </button>
                    <input id="map-up" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>
                </div>
              </div>

              {/* GAPS LIST */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash size={16} className="text-[#64748b]" />
                  <h3 className="text-sm font-bold text-[#1e293b]">Gaps List</h3>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {safe.gaps.map((g: any) => (
                    <div 
                      key={g.id} 
                      onClick={() => { setActiveGapId(g.id); setActiveTextId(null); }}
                      className={cn(
                        "p-3 rounded-xl border transition-all cursor-pointer",
                        activeGapId === g.id ? "bg-[#eff6ff] border-[#2563eb]" : "bg-[#f8fafc] border-[#e2e8f0] hover:border-[#cbd5e1]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#1e293b]">Gap {g.n}</span>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: g.id, type: 'gap' }); }} className="p-1 text-[#64748b] hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <GapAnswersInput 
                        answers={g.answers}
                        onChange={(newAnswers) => {
                          const newGaps = safe.gaps.map((gap: any) => gap.id === g.id ? { ...gap, answers: newAnswers } : gap);
                          setSafe({ ...safe, gaps: newGaps });
                        }}
                      />
                    </div>
                  ))}
                  {safe.gaps.length === 0 && (
                    <div className="text-center py-4 text-xs text-[#64748b] italic">No gaps added yet.</div>
                  )}
                </div>
              </div>

              {activeGap && (
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Hash size={16} className="text-[#2563eb]" />
                      <h3 className="text-sm font-bold text-[#1e293b]">Gap {activeGap.n}</h3>
                    </div>
                    <button onClick={() => setDeleteConfirm({ id: activeGap.id, type: 'gap' })} className="text-red-500 hover:text-red-700">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs text-[#64748b] mb-2">
                      Edit the answers in the <strong>Gaps List</strong> above.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Font Size</label>
                        <input 
                          type="number"
                          value={activeGap.style.fontSize}
                          onChange={(e) => {
                            const newGaps = safe.gaps.map((g: any) => g.id === activeGap.id ? { ...g, style: { ...g.style, fontSize: parseInt(e.target.value) } } : g);
                            setSafe({ ...safe, gaps: newGaps });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-xs outline-none focus:border-[#2563eb] transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Opacity</label>
                        <input 
                          type="range"
                          min="0.1" max="1" step="0.1"
                          value={activeGap.style.opacity}
                          onChange={(e) => {
                            const newGaps = safe.gaps.map((g: any) => g.id === activeGap.id ? { ...g, style: { ...g.style, opacity: parseFloat(e.target.value) } } : g);
                            setSafe({ ...safe, gaps: newGaps });
                          }}
                          className="w-full h-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeText && (
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Type size={16} className="text-[#2563eb]" />
                      <h3 className="text-sm font-bold text-[#1e293b]">Text Label</h3>
                    </div>
                    <button onClick={() => setDeleteConfirm({ id: activeText.id, type: 'text' })} className="text-red-500 hover:text-red-700">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Label Content</label>
                      <input 
                        type="text"
                        value={activeText.text}
                        onChange={(e) => {
                          const newTexts = safe.texts.map((t: any) => t.id === activeText.id ? { ...t, text: e.target.value } : t);
                          setSafe({ ...safe, texts: newTexts });
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Font Size</label>
                        <input 
                          type="number"
                          value={activeText.fontSize}
                          onChange={(e) => {
                            const newTexts = safe.texts.map((t: any) => t.id === activeText.id ? { ...t, fontSize: parseInt(e.target.value) } : t);
                            setSafe({ ...safe, texts: newTexts });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-xs outline-none focus:border-[#2563eb] transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Alignment</label>
                        <select 
                          value={activeText.align}
                          onChange={(e) => {
                            const newTexts = safe.texts.map((t: any) => t.id === activeText.id ? { ...t, align: e.target.value } : t);
                            setSafe({ ...safe, texts: newTexts });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-xs outline-none focus:border-[#2563eb] transition-all"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MAIN CANVAS AREA */}
            <div className="lg:col-span-3 flex flex-col min-h-0">
              <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
                <div className="px-6 py-3 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/50 shrink-0">
                  <div className="flex items-center gap-4">
                    {!showPreview ? (
                      <>
                        <div className="flex bg-[#f1f5f9] p-1 rounded-lg">
                          <button 
                            onClick={() => setEditorMode('gap')}
                            className={cn(
                              "px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                              editorMode === 'gap' ? "bg-white text-[#2563eb] shadow-sm" : "text-[#64748b] hover:text-[#1e293b]"
                            )}
                          >
                            Add Gaps
                          </button>
                          <button 
                            onClick={() => setEditorMode('text')}
                            className={cn(
                              "px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                              editorMode === 'text' ? "bg-white text-[#2563eb] shadow-sm" : "text-[#64748b] hover:text-[#1e293b]"
                            )}
                          >
                            Add Labels
                          </button>
                        </div>
                        <div className="text-[10px] text-[#64748b] font-medium italic">
                          Click on the image to add {editorMode === 'gap' ? 'a gap' : 'a label'}. Drag to move, corner to resize.
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-[#2563eb]">
                        <Eye size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Candidate Preview Mode</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-8 flex-grow overflow-auto bg-slate-100 flex flex-col items-center">
                  {showPreview && (
                    <div className="max-w-4xl w-full bg-white p-8 rounded-2xl shadow-sm mb-8 shrink-0">
                      <div className="text-xs font-bold text-[#2563eb] mb-1">{safe.numbering}</div>
                      <h4 className="text-lg font-bold text-[#1e293b] mb-6">{safe.instructions}</h4>
                    </div>
                  )}
                  {safe.image.dataUrl ? (
                    <div 
                      ref={containerRef}
                      onClick={!showPreview ? handleCanvasClick : undefined}
                      className={cn(
                        "relative shadow-2xl bg-white shrink-0",
                        !showPreview ? "cursor-crosshair" : "cursor-default"
                      )}
                      style={{ width: 'fit-content' }}
                    >
                      <img 
                        src={safe.image.dataUrl} 
                        draggable={false} 
                        className="max-w-none block select-none" 
                        style={{ maxHeight: '70vh' }}
                      />
                      
                      {/* GAPS LAYER */}
                      {safe.gaps.map((g: any) => (
                        <div 
                          key={g.id}
                          onMouseDown={!showPreview ? (e) => startDrag(e, g.id, 'gap', 'move') : undefined}
                          className={cn(
                            "absolute border flex items-center justify-center font-bold transition-shadow select-none",
                            !showPreview ? (activeGapId === g.id ? "border-[#2563eb] ring-2 ring-[#2563eb]/20 z-20 cursor-move" : "border-slate-800 z-10 cursor-move") : "border-slate-800 z-10"
                          )}
                          style={{
                            left: `${g.x * 100}%`,
                            top: `${g.y * 100}%`,
                            width: `${g.w * 100}%`,
                            height: `${g.h * 100}%`,
                            backgroundColor: showPreview ? 'white' : `rgba(255,255,255,${g.style.opacity})`,
                            fontSize: `${g.style.fontSize}px`
                          }}
                        >
                          {showPreview ? (
                            <input 
                              type="text"
                              className="w-full h-full bg-transparent text-center outline-none border-none"
                              placeholder={g.n.toString()}
                            />
                          ) : g.n}
                          {!showPreview && (
                            <div 
                              onMouseDown={(e) => startDrag(e, g.id, 'gap', 'resize')}
                              className="absolute -right-1 -bottom-1 w-3 h-3 bg-[#2563eb] border border-white rounded-sm cursor-nwse-resize" 
                            />
                          )}
                        </div>
                      ))}

                      {/* TEXT LAYER */}
                      {safe.texts.map((t: any) => (
                        <div 
                          key={t.id}
                          onMouseDown={!showPreview ? (e) => startDrag(e, t.id, 'text', 'move') : undefined}
                          className={cn(
                            "absolute border border-transparent flex items-center transition-shadow select-none p-1",
                            !showPreview ? (activeTextId === t.id ? "border-dashed border-[#2563eb] ring-2 ring-[#2563eb]/20 z-20 cursor-move" : "z-10 cursor-move") : "z-10"
                          )}
                          style={{
                            left: `${t.x * 100}%`,
                            top: `${t.y * 100}%`,
                            width: `${t.w * 100}%`,
                            height: `${t.h * 100}%`,
                            fontSize: `${t.fontSize}px`,
                            color: t.color,
                            fontWeight: t.bold ? 'bold' : 'normal',
                            justifyContent: t.align === 'center' ? 'center' : (t.align === 'right' ? 'flex-end' : 'flex-start'),
                            textAlign: t.align as any
                          }}
                        >
                          <span className="truncate">{t.text}</span>
                          {!showPreview && (
                            <div 
                              onMouseDown={(e) => startDrag(e, t.id, 'text', 'resize')}
                              className="absolute -right-1 -bottom-1 w-3 h-3 bg-[#2563eb] border border-white rounded-sm cursor-nwse-resize opacity-0 group-hover:opacity-100" 
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#64748b] p-20 border-2 border-dashed border-[#cbd5e1] rounded-3xl bg-white/50">
                      <ImageIcon size={48} className="opacity-20 mb-4" />
                      <p className="font-bold">No map image uploaded</p>
                      <p className="text-xs mt-1">Upload an image in the sidebar to start labeling.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ConfirmationModal 
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteConfirm?.type === 'gap' ? 'Gap' : 'Label'}?`}
        message={`Are you sure you want to delete this ${deleteConfirm?.type === 'gap' ? 'gap' : 'label'}? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}

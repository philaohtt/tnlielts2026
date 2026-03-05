import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  X,
  Settings2,
  Image as ImageIcon,
  Move,
  Eye,
  List
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import ConfirmationModal from '@/src/components/common/ConfirmationModal';

interface MatchingCanvasEditorProps {
  type: string;
  data: any;
  onSave: (newData: any) => void;
  onCancel: () => void;
}

export default function MatchingCanvasEditor({ type, data, onSave, onCancel }: MatchingCanvasEditorProps) {
  const [safe, setSafe] = useState<any>(null);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'marker' | 'item' } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<any>(null);
  const wasDragging = useRef(false);

  useEffect(() => {
    let initialMarkers = data?.markers;
    let initialItems = data?.items;

    // Migrate from old pairs format if necessary
    if (!initialMarkers && !initialItems && data?.pairs) {
      initialMarkers = data.pairs.map((p: any, i: number) => ({
        id: p.id || Math.random().toString(36).substr(2, 5),
        x: p.x, y: p.y, w: p.w, h: p.h,
        label: p.key || String.fromCharCode(65 + i)
      }));
      initialItems = data.pairs.map((p: any, i: number) => ({
        id: Math.random().toString(36).substr(2, 5),
        text: p.label || `Item ${i + 1}`,
        key: p.key || String.fromCharCode(65 + i)
      }));
    }

    const markers = Array.isArray(initialMarkers) ? initialMarkers.map((m: any) => ({
      id: m.id || Math.random().toString(36).substr(2, 5),
      x: m.x ?? 0.1,
      y: m.y ?? 0.1,
      w: m.w ?? 0.06,
      h: m.h ?? 0.06,
      label: m.label || 'A'
    })) : [];

    const items = Array.isArray(initialItems) ? initialItems.map((i: any) => ({
      id: i.id || Math.random().toString(36).substr(2, 5),
      text: i.text || '',
      key: i.key || ''
    })) : [];

    setSafe({
      numbering: data?.numbering || 'Questions 1-5',
      instructions: data?.instructions || 'Match the following items on the diagram.',
      image: data?.image || { dataUrl: null },
      markers,
      items
    });
  }, [data]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSafe({ ...safe, image: { dataUrl: reader.result } });
    };
    reader.readAsDataURL(file);
  };

  const addMarker = (x: number, y: number) => {
    const id = Math.random().toString(36).substr(2, 5);
    const nextLabel = String.fromCharCode(65 + safe.markers.length);
    const newMarker = {
      id, x: x - 0.03, y: y - 0.03, w: 0.06, h: 0.06,
      label: nextLabel
    };
    setSafe({ ...safe, markers: [...safe.markers, newMarker] });
    setActiveMarkerId(id);
  };

  const addItem = () => {
    const id = Math.random().toString(36).substr(2, 5);
    setSafe({
      ...safe,
      items: [...safe.items, { id, text: '', key: '' }]
    });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!containerRef.current || dragState.current || wasDragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    addMarker(x, y);
  };

  const startDrag = (e: React.MouseEvent, id: string, mode: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMarkerId(id);

    const item = safe.markers.find((m: any) => m.id === id);
    if (!item) return;

    dragState.current = {
      id, mode,
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

    const { id, mode } = dragState.current;

    const newMarkers = safe.markers.map((m: any) => {
      if (m.id !== id) return m;
      if (mode === 'move') {
        return { ...m, x: Math.max(0, Math.min(1 - m.w, dragState.current.startRelX + dx)), y: Math.max(0, Math.min(1 - m.h, dragState.current.startRelY + dy)) };
      } else {
        return { ...m, w: Math.max(0.02, Math.min(1 - m.x, dragState.current.startW + dx)), h: Math.max(0.02, Math.min(1 - m.y, dragState.current.startH + dy)) };
      }
    });
    setSafe((prev: any) => ({ ...prev, markers: newMarkers }));
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
    if (deleteConfirm.type === 'marker') {
      const newMarkers = safe.markers.filter((m: any) => m.id !== deleteConfirm.id);
      setSafe({ ...safe, markers: newMarkers });
      if (activeMarkerId === deleteConfirm.id) setActiveMarkerId(null);
    } else {
      const newItems = safe.items.filter((i: any) => i.id !== deleteConfirm.id);
      setSafe({ ...safe, items: newItems });
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
          <h2 className="font-bold text-[#1e293b]">Edit Visual Matching</h2>
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
            {/* LEFT SIDEBAR */}
            <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto pr-2">
              {/* SETTINGS */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-4 shrink-0">
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
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Diagram Image</label>
                    <button 
                      onClick={() => document.getElementById('diag-up')?.click()}
                      className="w-full py-2 border border-dashed border-[#cbd5e1] rounded-lg text-xs font-bold text-[#64748b] hover:bg-[#f8fafc] transition-all flex items-center justify-center gap-2"
                    >
                      <ImageIcon size={14} />
                      <span>{safe.image.dataUrl ? 'Change Image' : 'Upload Image'}</span>
                    </button>
                    <input id="diag-up" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>
                </div>
              </div>

              {/* MARKERS LIST */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-4 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Move size={16} className="text-[#64748b]" />
                  <h3 className="text-sm font-bold text-[#1e293b]">Markers (on image)</h3>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {safe.markers.map((m: any, idx: number) => (
                    <div 
                      key={m.id} 
                      onClick={() => setActiveMarkerId(m.id)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer",
                        activeMarkerId === m.id ? "bg-[#eff6ff] border-[#2563eb]" : "bg-[#f8fafc] border-[#e2e8f0] hover:border-[#cbd5e1]"
                      )}
                    >
                      <input 
                        type="text"
                        value={m.label}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const newMarkers = safe.markers.map((marker: any) => marker.id === m.id ? { ...marker, label: e.target.value } : marker);
                          setSafe({ ...safe, markers: newMarkers });
                        }}
                        placeholder="Label (e.g. A)"
                        className="w-full px-2 py-1 rounded border border-[#e2e8f0] text-xs font-bold text-center outline-none focus:border-[#2563eb]"
                      />
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: m.id, type: 'marker' }); }} className="p-1 text-[#64748b] hover:text-red-500 shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {safe.markers.length === 0 && (
                    <div className="text-center py-2 text-xs text-[#64748b] italic">Click on the image to add markers.</div>
                  )}
                </div>
              </div>

              {/* ITEMS LIST */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-4 flex-grow flex flex-col min-h-[250px]">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <List size={16} className="text-[#64748b]" />
                    <h3 className="text-sm font-bold text-[#1e293b]">Items to Match</h3>
                  </div>
                  <button 
                    onClick={addItem}
                    className="p-1 hover:bg-[#f1f5f9] rounded-lg text-[#2563eb] transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-2 overflow-y-auto pr-1 flex-grow">
                  {safe.items.map((item: any, idx: number) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
                      <span className="text-xs font-bold text-[#64748b] w-4 shrink-0 text-center">{idx + 1}</span>
                      <input 
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const newItems = safe.items.map((i: any) => i.id === item.id ? { ...i, text: e.target.value } : i);
                          setSafe({ ...safe, items: newItems });
                        }}
                        placeholder="Item text"
                        className="flex-grow min-w-0 bg-white border border-[#e2e8f0] px-2 py-1.5 rounded-lg text-xs outline-none focus:border-[#2563eb] transition-all"
                      />
                      <input 
                        type="text"
                        value={item.key}
                        onChange={(e) => {
                          const newItems = safe.items.map((i: any) => i.id === item.id ? { ...i, key: e.target.value.toUpperCase() } : i);
                          setSafe({ ...safe, items: newItems });
                        }}
                        placeholder="Key"
                        className="w-10 shrink-0 bg-white border border-[#e2e8f0] px-2 py-1.5 rounded-lg text-xs text-center font-bold outline-none focus:border-[#2563eb] transition-all"
                      />
                      <button 
                        onClick={() => setDeleteConfirm({ id: item.id, type: 'item' })}
                        className="p-1 shrink-0 text-[#cbd5e1] hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {safe.items.length === 0 && (
                    <div className="text-center py-4 text-xs text-[#64748b] italic">No items added yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* MAIN CANVAS AREA */}
            <div className="lg:col-span-3 flex flex-col min-h-0">
              <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
                <div className="px-6 py-3 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/50 shrink-0">
                  {!showPreview ? (
                    <div className="text-[10px] text-[#64748b] font-medium italic">
                      Click on the diagram to add a marker. Drag to move, corner to resize.
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[#2563eb]">
                      <Eye size={16} />
                      <span className="text-xs font-bold uppercase tracking-widest">Candidate Preview Mode</span>
                    </div>
                  )}
                </div>
                
                <div className="p-8 flex-grow overflow-auto bg-slate-100 flex flex-col items-center">
                  {showPreview && (
                    <div className="max-w-4xl w-full bg-white p-8 rounded-2xl shadow-sm mb-8 shrink-0">
                      <div className="text-xs font-bold text-[#2563eb] mb-1">{safe.numbering}</div>
                      <h4 className="text-lg font-bold text-[#1e293b] mb-6">{safe.instructions}</h4>
                    </div>
                  )}
                  
                  {safe.image.dataUrl ? (
                    <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
                      <div 
                        ref={containerRef}
                        onClick={!showPreview ? handleCanvasClick : undefined}
                        className={cn(
                          "relative shadow-xl bg-white shrink-0 rounded-lg overflow-hidden border border-slate-200",
                          !showPreview ? "cursor-crosshair" : "cursor-default"
                        )}
                        style={{ width: 'fit-content' }}
                      >
                        <img 
                          src={safe.image.dataUrl} 
                          draggable={false} 
                          className="max-w-none block select-none" 
                          style={{ maxHeight: '60vh' }}
                        />
                        
                        {safe.markers.map((m: any) => (
                          <div 
                            key={m.id}
                            onMouseDown={!showPreview ? (e) => startDrag(e, m.id, 'move') : undefined}
                            className={cn(
                              "absolute border-2 flex items-center justify-center font-bold transition-all select-none",
                              !showPreview ? (activeMarkerId === m.id ? "border-[#2563eb] bg-[#2563eb]/20 z-20 cursor-move" : "border-slate-800 bg-white/80 z-10 cursor-move") : "border-slate-800 bg-white/90 z-10"
                            )}
                            style={{
                              left: `${m.x * 100}%`,
                              top: `${m.y * 100}%`,
                              width: `${m.w * 100}%`,
                              height: `${m.h * 100}%`,
                              borderRadius: '4px'
                            }}
                          >
                            <span className="text-slate-800">{m.label || '?'}</span>
                            {!showPreview && (
                              <div 
                                onMouseDown={(e) => startDrag(e, m.id, 'resize')}
                                className="absolute -right-1 -bottom-1 w-3 h-3 bg-[#2563eb] border border-white rounded-sm cursor-nwse-resize" 
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Preview Items List */}
                      {showPreview && safe.items.length > 0 && (
                        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                          <div className="space-y-3">
                            {safe.items.map((item: any, idx: number) => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex gap-3">
                                  <span className="font-bold text-[#1e293b]">{idx + 1}.</span>
                                  <span className="text-sm text-[#1e293b]">{item.text || '(Empty item)'}</span>
                                </div>
                                <div className="w-12 h-8 border-2 border-slate-200 rounded-lg bg-white flex items-center justify-center font-bold text-[#2563eb]">
                                  {/* Placeholder for input */}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#64748b] p-20 border-2 border-dashed border-[#cbd5e1] rounded-3xl bg-white/50 w-full max-w-2xl">
                      <ImageIcon size={48} className="opacity-20 mb-4" />
                      <p className="font-bold">No diagram image uploaded</p>
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
        title={`Delete ${deleteConfirm?.type === 'marker' ? 'Marker' : 'Item'}?`}
        message={`Are you sure you want to delete this ${deleteConfirm?.type === 'marker' ? 'marker' : 'item'}? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}


import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  X,
  Settings2,
  Type,
  Hash,
  Info,
  Eye,
  Layout,
  Split
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Editor } from '@tinymce/tinymce-react';
import { cn } from '@/src/lib/utils';
import ConfirmationModal from '@/src/components/common/ConfirmationModal';

// Remove custom Gap blot since we use TinyMCE

interface GapFillEditorProps {
  data: any;
  onSave: (newData: any) => void;
  onCancel: () => void;
}

export default function GapFillEditor({ data, onSave, onCancel }: GapFillEditorProps) {
  const [safe, setSafe] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setSafe({
      numbering: data?.numbering || 'Questions 1-3',
      instructions: data?.instructions || 'Fill in the blank',
      passageHtml: data?.passageHtml || '<p>Select text and click Mark Selected Text as Gap.</p>',
      gaps: Array.isArray(data?.gaps) ? data.gaps.map((g: any) => ({...g})) : []
    });
  }, [data]);

  const syncGapsFromHtml = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const markers = doc.querySelectorAll('.gap-marker');
    
    const newGaps = Array.from(markers).map((m: any, i: number) => {
      const id = m.dataset.id || 'g' + Math.random().toString(36).substr(2, 5);
      m.dataset.id = id;
      m.dataset.index = i + 1;

      const existing = (safe.gaps || []).find((g: any) => g.id === id);
      return existing || { id, answers: [m.textContent.trim()], caseSensitive: false };
    });
    
    // Update indices in the HTML
    return { gaps: newGaps, html: doc.body.innerHTML };
  };

  const handleMarkGap = () => {
    const editor = editorRef.current?.editor;
    if (!editor) return;

    const selection = editor.selection.getContent();
    if (selection) {
      const id = 'g' + Math.random().toString(36).substr(2, 5);
      const index = safe.gaps.length + 1;
      
      const markerHtml = `<span class="gap-marker" data-id="${id}" data-index="${index}">${selection}</span>`;
      editor.selection.setContent(markerHtml);
      
      // Sync gaps immediately to update the list
      setTimeout(() => {
        const { gaps, html } = syncGapsFromHtml(editor.getContent());
        setSafe({ ...safe, gaps, passageHtml: html });
      }, 0);
    }
  };

  const handleUpdateGap = (idx: number, field: string, value: any) => {
    const newGaps = [...safe.gaps];
    newGaps[idx] = { ...newGaps[idx], [field]: value };
    setSafe({ ...safe, gaps: newGaps });
  };

  const deleteGap = (id: string) => {
    const editor = editorRef.current?.editor;
    if (!editor) return;

    const html = editor.getContent();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const marker = doc.querySelector(`.gap-marker[data-id="${id}"]`);
    
    if (marker) {
      const parent = marker.parentNode;
      while (marker.firstChild) {
        parent?.insertBefore(marker.firstChild, marker);
      }
      parent?.removeChild(marker);
      
      const { gaps, html: newHtml } = syncGapsFromHtml(doc.body.innerHTML);
      setSafe({ ...safe, gaps, passageHtml: newHtml });
      // Also update editor content
      editor.setContent(newHtml);
    }
    setDeleteConfirmId(null);
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
          <h2 className="font-bold text-[#1e293b]">Edit Gap Fill</h2>
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
            onClick={() => {
              const editor = editorRef.current?.editor;
              const html = editor?.getContent() || safe.passageHtml;
              const { gaps, html: finalHtml } = syncGapsFromHtml(html);
              onSave({ ...safe, gaps, passageHtml: finalHtml });
            }}
            className="bg-[#2563eb] text-white px-6 py-1.5 rounded-lg text-xs font-bold hover:bg-[#1d4ed8] transition-all shadow-sm"
          >
            Save Block
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-hidden flex flex-row">
        {/* EDITOR SIDE */}
        <div className={cn(
          "p-6 transition-all duration-300 overflow-y-auto",
          showPreview ? "w-1/2 border-r border-[#e2e8f0]" : "w-full max-w-4xl mx-auto"
        )}>
          <div className="space-y-6">
            {/* SETTINGS */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Numbering</label>
                  <input 
                    type="text"
                    value={safe.numbering}
                    onChange={(e) => setSafe({ ...safe, numbering: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Instructions</label>
                  <input 
                    type="text"
                    value={safe.instructions}
                    onChange={(e) => setSafe({ ...safe, instructions: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* PASSAGE EDITOR */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm flex flex-col min-h-[400px]">
              <div className="px-6 py-3 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2">
                  <Type size={16} className="text-[#64748b]" />
                  <span className="text-xs font-bold text-[#1e293b]">Passage Editor</span>
                </div>
                <button 
                  onClick={handleMarkGap}
                  className="flex items-center gap-2 bg-[#2563eb] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-[#1d4ed8] transition-all shadow-sm"
                >
                  <Plus size={14} />
                  <span>Mark Selected Text as Gap</span>
                </button>
              </div>
              <div className="p-0 relative">
                <Editor
                  onInit={(evt, editor) => editorRef.current = { editor }}
                  tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/7.3.0/tinymce.min.js"
                  licenseKey="gpl"
                  value={safe.passageHtml}
                  onEditorChange={(content) => {
                    // Don't sync gaps on every change to avoid reversal/cursor issues
                    // We'll sync on blur or manually
                    setSafe({ ...safe, passageHtml: content });
                  }}
                  onBlur={() => {
                    const editor = editorRef.current?.editor;
                    if (editor) {
                      const { gaps, html } = syncGapsFromHtml(editor.getContent());
                      setSafe({ ...safe, gaps, passageHtml: html });
                    }
                  }}
                  init={{
                    min_height: 400,
                    width: '100%',
                    menubar: true,
                    contextmenu: false,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                      'insertdatetime', 'media', 'table', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                      'bold italic forecolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'table | removeformat | fullscreen | help',
                    content_style: `
                      body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px }
                      .gap-marker {
                        background-color: #e3f2fd;
                        border-bottom: 2px solid #2563eb;
                        padding: 0 4px;
                        border-radius: 2px;
                        color: #2563eb;
                        font-weight: bold;
                      }
                      .gap-marker::before {
                        content: "(" attr(data-index) ") ";
                        font-weight: bold;
                        margin-right: 2px;
                        color: #2563eb;
                        font-size: 0.9em;
                      }
                    `,
                    table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | tablemergecells tablesplitcells',
                    resize: true,
                  }}
                />
              </div>
            </div>

            {/* GAPS LIST */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm flex flex-col shrink-0 max-h-[300px]">
              <div className="px-6 py-3 border-b border-[#e2e8f0] flex items-center gap-2 bg-slate-50/50 shrink-0">
                <Hash size={16} className="text-[#64748b]" />
                <span className="text-xs font-bold text-[#1e293b]">Gaps & Answers</span>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto">
                {safe.gaps.length > 0 ? (
                  safe.gaps.map((g: any, idx: number) => (
                    <GapItem 
                      key={g.id}
                      gap={g}
                      index={idx}
                      onUpdate={(field, val) => handleUpdateGap(idx, field, val)}
                      onDelete={() => setDeleteConfirmId(g.id)}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-[#64748b]">
                    <Info size={32} className="opacity-20 mb-3" />
                    <p className="text-xs leading-relaxed">
                      No gaps marked yet.<br />Select text in the passage and click "Mark Selected Text as Gap".
                    </p>
                  </div>
                )}
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
                  
                  <div className="tinymce-content leading-loose">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: safe.passageHtml.replace(/<span class="gap-marker"[^>]*>(.*?)<\/span>/g, (match: string, content: string, offset: number, string: string) => {
                          const indexMatch = match.match(/data-index="([^"]+)"/);
                          const idx = indexMatch ? indexMatch[1] : '?';
                          return `<input type="text" placeholder="${idx}" class="inline-block w-28 h-8 mx-1 border border-slate-300 rounded-md bg-white px-2 py-1 text-center text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400 placeholder:font-bold shadow-sm" />`;
                        })
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ConfirmationModal 
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && deleteGap(deleteConfirmId)}
        title="Remove Gap"
        message="Are you sure you want to remove this gap? The text will be restored to the passage."
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .gap-marker {
          background-color: #e3f2fd;
          border-bottom: 2px solid #2563eb;
          padding: 0 4px;
          border-radius: 2px;
          color: #2563eb;
          font-weight: bold;
        }
        .gap-marker::before {
          content: "(" attr(data-index) ") ";
          font-weight: bold;
          margin-right: 2px;
          color: #2563eb;
          font-size: 0.9em;
        }
      `}} />
    </div>
  );
}

function GapItem({ gap, index, onUpdate, onDelete }: { gap: any, index: number, onUpdate: (field: string, val: any) => void, onDelete: () => void }) {
  const [localAnswers, setLocalAnswers] = useState(gap.answers.join('; '));

  useEffect(() => {
    setLocalAnswers(gap.answers.join('; '));
  }, [gap.id]);

  const handleAnswersChange = (val: string) => {
    setLocalAnswers(val);
    const answers = val.split(';').map(s => s.trim()).filter(s => s);
    onUpdate('answers', answers);
  };

  return (
    <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <div className="w-6 h-6 rounded-lg bg-[#2563eb] text-white flex items-center justify-center text-[10px] font-bold">
          {index + 1}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={gap.caseSensitive}
              onChange={(e) => onUpdate('caseSensitive', e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#cbd5e1] text-[#2563eb] focus:ring-[#2563eb]"
            />
            <span className="text-[10px] font-bold text-[#64748b] uppercase">Case Sensitive</span>
          </label>
          <button 
            onClick={onDelete}
            className="p-1 text-[#cbd5e1] hover:text-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider">Answers (separate with ;)</label>
        <input 
          type="text"
          value={localAnswers}
          onChange={(e) => handleAnswersChange(e.target.value)}
          placeholder="e.g. answer 1; alt answer"
          className="w-full px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white text-sm outline-none focus:border-[#2563eb] transition-all"
        />
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  X,
  Settings2,
  CheckCircle2,
  HelpCircle,
  Eye,
  Split
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import ConfirmationModal from '@/src/components/common/ConfirmationModal';

interface TfngEditorProps {
  data: any;
  onSave: (newData: any) => void;
  onCancel: () => void;
}

export default function TfngEditor({ data, onSave, onCancel }: TfngEditorProps) {
  const [safe, setSafe] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);

  const MODES: Record<string, any> = {
    TFNG: { label: "TRUE / FALSE", options: ["TRUE", "FALSE", "NOT GIVEN"] },
    YNNG: { label: "YES / NO", options: ["YES", "NO", "NOT GIVEN"] }
  };

  useEffect(() => {
    setSafe({
      numbering: data?.numbering || 'Questions 1–5',
      instructions: data?.instructions || 'Do the following statements agree with the information given in the Reading Passage?',
      mode: (data?.mode === 'YNNG') ? 'YNNG' : 'TFNG',
      questions: Array.isArray(data?.questions) ? data.questions.map((q: any) => ({
        id: q.id || Math.random().toString(36).substr(2, 9),
        statement: q.statement || '',
        answer: q.answer || (data?.mode === 'YNNG' ? 'YES' : 'TRUE') 
      })) : []
    });
  }, [data]);

  const handleUpdateQuestion = (idx: number, field: string, value: any) => {
    const newQuestions = [...safe.questions];
    newQuestions[idx] = { ...newQuestions[idx], [field]: value };
    setSafe({ ...safe, questions: newQuestions });
  };

  const addQuestion = () => {
    setSafe({
      ...safe,
      questions: [
        ...safe.questions,
        { id: Math.random().toString(36).substr(2, 9), statement: '', answer: safe.mode === 'YNNG' ? 'YES' : 'TRUE' }
      ]
    });
  };

  const deleteQuestion = () => {
    if (deleteConfirmIdx === null) return;
    const newQuestions = safe.questions.filter((_: any, i: number) => i !== deleteConfirmIdx);
    setSafe({ ...safe, questions: newQuestions });
    setDeleteConfirmIdx(null);
  };

  const handleModeChange = (newMode: string) => {
    if (safe.mode === newMode) return;
    
    // Map answers if possible
    const newQuestions = safe.questions.map((q: any) => {
      let newAnswer = q.answer;
      if (newMode === 'YNNG') {
        if (q.answer === 'TRUE') newAnswer = 'YES';
        else if (q.answer === 'FALSE') newAnswer = 'NO';
      } else {
        if (q.answer === 'YES') newAnswer = 'TRUE';
        else if (q.answer === 'NO') newAnswer = 'FALSE';
      }
      return { ...q, answer: newAnswer };
    });

    setSafe({ ...safe, mode: newMode, questions: newQuestions });
  };

  if (!safe) return null;

  const modeConfig = MODES[safe.mode];

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
          <h2 className="font-bold text-[#1e293b]">Edit TFNG / YNNG</h2>
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
          "flex flex-col h-full p-6 transition-all duration-300 overflow-y-auto",
          showPreview ? "w-1/2 border-r border-[#e2e8f0]" : "w-full max-w-4xl mx-auto"
        )}>
          <div className="space-y-6">
            {/* SETTINGS */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 size={16} className="text-[#64748b]" />
                <h3 className="text-sm font-bold text-[#1e293b]">Block Settings</h3>
              </div>
              <div className="flex bg-[#f1f5f9] p-1 rounded-lg">
                <button 
                  onClick={() => handleModeChange('TFNG')}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                    safe.mode === 'TFNG' ? "bg-white text-[#2563eb] shadow-sm" : "text-[#64748b] hover:text-[#1e293b]"
                  )}
                >
                  TFNG
                </button>
                <button 
                  onClick={() => handleModeChange('YNNG')}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                    safe.mode === 'YNNG' ? "bg-white text-[#2563eb] shadow-sm" : "text-[#64748b] hover:text-[#1e293b]"
                  )}
                >
                  YNNG
                </button>
              </div>
            </div>

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

          {/* QUESTIONS LIST */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1e293b]">Statements</h3>
              <button 
                onClick={addQuestion}
                className="flex items-center gap-2 bg-white border border-[#e2e8f0] px-4 py-2 rounded-lg text-xs font-bold text-[#1e293b] hover:border-[#2563eb] hover:text-[#2563eb] transition-all shadow-sm"
              >
                <Plus size={16} />
                <span>Add Statement</span>
              </button>
            </div>

            <div className="space-y-3">
              {safe.questions.map((q: any, idx: number) => (
                <div key={q.id} className="bg-white border border-[#e2e8f0] rounded-2xl p-4 flex items-start gap-4 shadow-sm group">
                  <div className="w-8 h-8 rounded-lg bg-[#f8fafc] flex items-center justify-center text-[#2563eb] font-bold text-sm shrink-0 mt-1">
                    {idx + 1}
                  </div>
                  
                  <div className="flex-grow space-y-3">
                    <textarea 
                      value={q.statement}
                      onChange={(e) => handleUpdateQuestion(idx, 'statement', e.target.value)}
                      placeholder="Enter statement text..."
                      className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all min-h-[60px] resize-none"
                    />
                    
                    <div className="flex flex-wrap gap-2">
                      {modeConfig.options.map((opt: string) => (
                        <button
                          key={opt}
                          onClick={() => handleUpdateQuestion(idx, 'answer', opt)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                            q.answer === opt 
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" 
                              : "bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1]"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => setDeleteConfirmIdx(idx)}
                    className="p-2 text-[#cbd5e1] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
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
                  
                  <div className="space-y-4">
                    {safe.questions.map((q: any, idx: number) => (
                      <div key={q.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="flex gap-4">
                          <span className="font-bold text-[#1e293b]">{idx + 1}.</span>
                          <span className="text-sm text-[#1e293b]">{q.statement || '(Empty statement)'}</span>
                        </div>
                        <div className="flex gap-2">
                          {modeConfig.options.map((opt: string) => (
                            <div 
                              key={opt}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50"
                            >
                              {opt}
                            </div>
                          ))}
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
        isOpen={deleteConfirmIdx !== null}
        onClose={() => setDeleteConfirmIdx(null)}
        onConfirm={deleteQuestion}
        title="Delete Statement?"
        message="Are you sure you want to delete this statement? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  X,
  Settings2,
  HelpCircle,
  Eye,
  Split
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import ConfirmationModal from '@/src/components/common/ConfirmationModal';

interface McqSetEditorProps {
  data: any;
  onSave: (newData: any) => void;
  onCancel: () => void;
}

export default function McqSetEditor({ data, onSave, onCancel }: McqSetEditorProps) {
  const [safe, setSafe] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);

  useEffect(() => {
    // Normalize data
    setSafe({
      numbering: data?.numbering || 'Questions 1-3',
      instruction: data?.instruction || 'Choose the correct letter, A, B or C',
      questionCountMode: data?.questionCountMode || 'byItem',
      questions: Array.isArray(data?.questions) ? data.questions.map((q: any) => ({
        id: q?.id || Math.random().toString(36).slice(2, 9),
        prompt: q?.prompt || q?.text || '',
        options: Array.isArray(q?.options) ? q.options.map((o: any) => typeof o === 'string' ? o : o.text || '') : ['', '', ''],
        allowMultiple: !!q.allowMultiple,
        correctIndices: Array.isArray(q.correctIndices) ? q.correctIndices : [q.correctIndex || 0]
      })) : []
    });
  }, [data]);

  const computeQuestionCount = () => {
    if (!safe) return 0;
    if (safe.questionCountMode === 'byCorrectAnswers') {
      return safe.questions.reduce((sum: number, q: any) => {
        const count = Array.isArray(q.correctIndices) && q.correctIndices.length > 0 
          ? q.correctIndices.length 
          : 1;
        return sum + count;
      }, 0);
    }
    return safe.questions.length;
  };

  const handleUpdateQuestion = (idx: number, field: string, value: any) => {
    const newQuestions = [...safe.questions];
    newQuestions[idx] = { ...newQuestions[idx], [field]: value };
    setSafe({ ...safe, questions: newQuestions });
  };

  const handleUpdateOption = (qIdx: number, oIdx: number, value: string) => {
    const newQuestions = [...safe.questions];
    const newOptions = [...newQuestions[qIdx].options];
    newOptions[oIdx] = value;
    newQuestions[qIdx] = { ...newQuestions[qIdx], options: newOptions };
    setSafe({ ...safe, questions: newQuestions });
  };

  const toggleCorrect = (qIdx: number, oIdx: number) => {
    const newQuestions = [...safe.questions];
    const q = newQuestions[qIdx];
    let newCorrect = [...(q.correctIndices || [])];

    if (!q.allowMultiple) {
      newCorrect = [oIdx];
    } else {
      if (newCorrect.includes(oIdx)) {
        newCorrect = newCorrect.filter(i => i !== oIdx);
      } else {
        newCorrect.push(oIdx);
      }
    }

    newQuestions[qIdx] = { ...q, correctIndices: newCorrect };
    setSafe({ ...safe, questions: newQuestions });
  };

  const addQuestion = () => {
    setSafe({
      ...safe,
      questions: [
        ...safe.questions,
        { 
          id: Math.random().toString(36).slice(2), 
          prompt: '', 
          options: ['', '', ''], 
          correctIndices: [0], 
          allowMultiple: false 
        }
      ]
    });
  };

  const deleteQuestion = () => {
    if (deleteConfirmIdx === null) return;
    const newQuestions = safe.questions.filter((_: any, i: number) => i !== deleteConfirmIdx);
    setSafe({ ...safe, questions: newQuestions });
    setDeleteConfirmIdx(null);
  };

  const addOption = (qIdx: number) => {
    const newQuestions = [...safe.questions];
    newQuestions[qIdx].options.push('');
    setSafe({ ...safe, questions: newQuestions });
  };

  const deleteOption = (qIdx: number, oIdx: number) => {
    const newQuestions = [...safe.questions];
    const q = newQuestions[qIdx];
    q.options.splice(oIdx, 1);
    q.correctIndices = q.correctIndices
      .filter((i: number) => i !== oIdx)
      .map((i: number) => i > oIdx ? i - 1 : i);
    setSafe({ ...safe, questions: newQuestions });
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
          <h2 className="font-bold text-[#1e293b]">Edit MCQ Set</h2>
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
            {/* GENERAL SETTINGS */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 size={16} className="text-[#64748b]" />
              <h3 className="text-sm font-bold text-[#1e293b]">General Settings</h3>
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
                <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Instruction</label>
                <input 
                  type="text"
                  value={safe.instruction}
                  onChange={(e) => setSafe({ ...safe, instruction: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#f1f5f9]">
              <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block mb-3">Question Counting Mode</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button 
                  onClick={() => setSafe({ ...safe, questionCountMode: 'byItem' })}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    safe.questionCountMode === 'byItem' 
                      ? "bg-[#eff6ff] border-[#2563eb] ring-1 ring-[#2563eb]" 
                      : "bg-white border-[#e2e8f0] hover:border-[#cbd5e1]"
                  )}
                >
                  <div className="font-bold text-xs text-[#1e293b] mb-1">Count by item</div>
                  <div className="text-[10px] text-[#64748b]">1 MCQ item = 1 question</div>
                </button>
                <button 
                  onClick={() => setSafe({ ...safe, questionCountMode: 'byCorrectAnswers' })}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    safe.questionCountMode === 'byCorrectAnswers' 
                      ? "bg-[#eff6ff] border-[#2563eb] ring-1 ring-[#2563eb]" 
                      : "bg-white border-[#e2e8f0] hover:border-[#cbd5e1]"
                  )}
                >
                  <div className="font-bold text-xs text-[#1e293b] mb-1">Count by correct answers</div>
                  <div className="text-[10px] text-[#64748b]">IELTS: Choose TWO = 2 questions</div>
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-[#64748b] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <HelpCircle size={14} />
                <span>This block counts as <strong>{computeQuestionCount()}</strong> question{computeQuestionCount() !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* QUESTIONS LIST */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1e293b]">Questions</h3>
              <button 
                onClick={addQuestion}
                className="flex items-center gap-2 bg-white border border-[#e2e8f0] px-4 py-2 rounded-lg text-xs font-bold text-[#1e293b] hover:border-[#2563eb] hover:text-[#2563eb] transition-all shadow-sm"
              >
                <Plus size={16} />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-4">
              {safe.questions.map((q: any, qIdx: number) => (
                <div key={q.id} className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-3 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/50">
                    <span className="text-xs font-bold text-[#1e293b]">Question {qIdx + 1}</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={q.allowMultiple}
                          onChange={(e) => handleUpdateQuestion(qIdx, 'allowMultiple', e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-[#cbd5e1] text-[#2563eb] focus:ring-[#2563eb]"
                        />
                        <span className="text-[10px] font-bold text-[#64748b] uppercase group-hover:text-[#1e293b] transition-colors">Multiple Answers</span>
                      </label>
                      <button 
                        onClick={() => setDeleteConfirmIdx(qIdx)}
                        className="p-1 text-[#64748b] hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Question Prompt</label>
                      <textarea 
                        value={q.prompt}
                        onChange={(e) => handleUpdateQuestion(qIdx, 'prompt', e.target.value)}
                        placeholder="Enter the question text..."
                        className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all min-h-[60px] resize-none"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Options & Correct Answer</label>
                      <div className="space-y-2">
                        {q.options.map((opt: string, oIdx: number) => {
                          const isCorrect = (q.correctIndices || []).includes(oIdx);
                          return (
                            <div key={oIdx} className={cn(
                              "flex items-center gap-3 p-2 rounded-xl border transition-all",
                              isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-white border-[#e2e8f0]"
                            )}>
                              <button 
                                onClick={() => toggleCorrect(qIdx, oIdx)}
                                className={cn(
                                  "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                                  isCorrect ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                )}
                              >
                                {isCorrect ? <CheckCircle2 size={14} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                              </button>
                              <span className="text-xs font-bold text-[#64748b] w-4 text-center">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <input 
                                type="text"
                                value={opt}
                                onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                className="flex-grow bg-transparent border-none text-sm outline-none font-medium"
                              />
                              <button 
                                onClick={() => deleteOption(qIdx, oIdx)}
                                className="p-1 text-[#cbd5e1] hover:text-red-500 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })}
                        <button 
                          onClick={() => addOption(qIdx)}
                          className="w-full py-2 border border-dashed border-[#e2e8f0] rounded-xl text-[10px] font-bold text-[#64748b] hover:border-[#2563eb] hover:text-[#2563eb] transition-all"
                        >
                          + Add Option
                        </button>
                      </div>
                    </div>
                  </div>
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
                  <h4 className="text-lg font-bold text-[#1e293b] mb-4">{safe.instruction}</h4>
                  
                  <div className="space-y-6">
                    {safe.questions.map((q: any, i: number) => (
                      <div key={q.id} className="space-y-3">
                        <div className="flex gap-3">
                          <span className="font-bold text-[#1e293b]">{i + 1}.</span>
                          {q.prompt ? (
                            <div className="text-[#1e293b] font-medium" dangerouslySetInnerHTML={{ __html: q.prompt }} />
                          ) : (
                            <p className="text-[#1e293b] font-medium italic text-slate-400">(No question prompt)</p>
                          )}
                        </div>
                        <div className="pl-6 space-y-2">
                          {q.options.map((opt: string, oIdx: number) => (
                            <div key={oIdx} className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                {String.fromCharCode(65 + oIdx)}
                              </div>
                              <span className="text-sm text-slate-600">{opt || `Option ${String.fromCharCode(65 + oIdx)}`}</span>
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
        title="Delete Question?"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}

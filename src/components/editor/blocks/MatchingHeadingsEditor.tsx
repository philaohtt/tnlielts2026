import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Plus, Trash2, X, Settings2, List, Eye, Split, Heading, FileText
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import ConfirmationModal from '@/src/components/common/ConfirmationModal';
import { Editor } from '@tinymce/tinymce-react';

interface MatchingHeadingsEditorProps {
  data: any;
  onSave: (newData: any) => void;
  onCancel: () => void;
  section?: any;
  onUpdateSection?: (field: string, value: any) => void;
}

export default function MatchingHeadingsEditor({ data, onSave, onCancel, section, onUpdateSection }: MatchingHeadingsEditorProps) {
  const [safe, setSafe] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState<'questions' | 'passage'>('questions');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'heading' | 'question', idx: number } | null>(null);

  useEffect(() => {
    setSafe({
      numbering: data?.numbering || '',
      instructions: data?.instructions || 'Choose the correct heading for each paragraph from the list of headings below.',
      headings: Array.isArray(data?.headings) ? data.headings.map((h: any) => ({...h})) : [],
      questions: Array.isArray(data?.questions) ? data.questions.map((q: any) => ({...q})) : []
    });
  }, [data]);

  const handleUpdateHeading = (idx: number, value: string) => {
    const newHeadings = [...safe.headings];
    newHeadings[idx] = { text: value };
    setSafe({ ...safe, headings: newHeadings });
  };

  const handleUpdateQuestion = (idx: number, field: string, value: string) => {
    const newQs = [...safe.questions];
    newQs[idx] = { ...newQs[idx], [field]: value };
    setSafe({ ...safe, questions: newQs });
  };

  const addHeading = () => {
    setSafe({ ...safe, headings: [...safe.headings, { text: '' }] });
  };

  const addQuestion = () => {
    const nextChar = String.fromCharCode(65 + safe.questions.length);
    setSafe({ ...safe, questions: [...safe.questions, { paragraph: `Paragraph ${nextChar}`, answer: '' }] });
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'heading') {
      const newHeadings = safe.headings.filter((_: any, i: number) => i !== deleteConfirm.idx);
      setSafe({ ...safe, headings: newHeadings });
    } else {
      const newQs = safe.questions.filter((_: any, i: number) => i !== deleteConfirm.idx);
      setSafe({ ...safe, questions: newQs });
    }
    setDeleteConfirm(null);
  };

  if (!safe) return null;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <header className="h-14 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-1.5 hover:bg-[#f1f5f9] rounded-lg text-[#64748b] transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="h-6 w-[1px] bg-[#e2e8f0]" />
          <h2 className="font-bold text-[#1e293b]">Edit Matching Headings</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowPreview(!showPreview)} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", showPreview ? "bg-[#eff6ff] text-[#2563eb]" : "text-[#64748b] hover:bg-[#f1f5f9]")}>
            <Split size={14} />
            <span>{showPreview ? "Hide Preview" : "Show Preview"}</span>
          </button>
          <button onClick={() => onSave(safe)} className="bg-[#2563eb] text-white px-6 py-1.5 rounded-lg text-xs font-bold hover:bg-[#1d4ed8] transition-all shadow-sm">
            Save Block
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-hidden flex flex-row">
        {/* EDITOR SIDE */}
        <div className={cn("flex flex-col h-full p-6 transition-all duration-300", showPreview ? "w-1/2 border-r border-[#e2e8f0]" : "w-full max-w-5xl mx-auto")}>
          <div className="flex flex-col h-full space-y-6">
            {/* SETTINGS */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 size={16} className="text-[#64748b]" />
                <h3 className="text-sm font-bold text-[#1e293b]">General Info</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Numbering</label>
                  <input type="text" value={safe.numbering} onChange={(e) => setSafe({ ...safe, numbering: e.target.value })} placeholder="e.g. Questions 1-5" className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Instructions</label>
                  <input type="text" value={safe.instructions} onChange={(e) => setSafe({ ...safe, instructions: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg w-fit shrink-0">
              <button 
                onClick={() => setActiveTab('questions')}
                className={cn("px-4 py-1.5 rounded-md text-sm font-bold transition-all", activeTab === 'questions' ? "bg-white text-[#2563eb] shadow-sm" : "text-slate-500 hover:text-slate-700")}
              >
                Questions & Headings
              </button>
              <button 
                onClick={() => setActiveTab('passage')}
                className={cn("px-4 py-1.5 rounded-md text-sm font-bold transition-all", activeTab === 'passage' ? "bg-white text-[#2563eb] shadow-sm" : "text-slate-500 hover:text-slate-700")}
              >
                Edit Passage
              </button>
            </div>

            {activeTab === 'questions' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
                {/* HEADINGS LIST */}
                <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="px-6 py-3 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-2">
                      <Heading size={16} className="text-[#64748b]" />
                      <span className="text-xs font-bold text-[#1e293b]">List of Headings</span>
                    </div>
                    <button onClick={addHeading} className="p-1 hover:bg-white rounded-lg text-[#2563eb] transition-all border border-transparent hover:border-[#e2e8f0]">
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="p-4 space-y-2 overflow-y-auto flex-grow">
                    {safe.headings.map((h: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
                        <span className="text-xs font-bold text-[#64748b] w-6 shrink-0 text-center">{idx + 1}</span>
                        <input type="text" value={h.text} onChange={(e) => handleUpdateHeading(idx, e.target.value)} placeholder="Heading text" className="flex-grow min-w-0 bg-white border border-[#e2e8f0] px-3 py-1.5 rounded-lg text-sm outline-none focus:border-[#2563eb] transition-all" />
                        <button onClick={() => setDeleteConfirm({ type: 'heading', idx })} className="p-1 shrink-0 text-[#cbd5e1] hover:text-red-500 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* QUESTIONS LIST */}
                <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="px-6 py-3 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-2">
                      <List size={16} className="text-[#64748b]" />
                      <span className="text-xs font-bold text-[#1e293b]">Questions (Paragraphs)</span>
                    </div>
                    <button onClick={addQuestion} className="p-1 hover:bg-white rounded-lg text-[#2563eb] transition-all border border-transparent hover:border-[#e2e8f0]">
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="p-4 space-y-2 overflow-y-auto flex-grow">
                    {safe.questions.map((q: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
                        <span className="text-xs font-bold text-[#64748b] w-4 shrink-0 text-center">{idx + 1}</span>
                        <input type="text" value={q.paragraph} onChange={(e) => handleUpdateQuestion(idx, 'paragraph', e.target.value)} placeholder="Paragraph A" className="flex-grow min-w-0 bg-white border border-[#e2e8f0] px-3 py-1.5 rounded-lg text-sm outline-none focus:border-[#2563eb] transition-all" />
                        <input type="text" value={q.answer} onChange={(e) => handleUpdateQuestion(idx, 'answer', e.target.value.toLowerCase())} placeholder="ii" className="w-12 shrink-0 bg-white border border-[#e2e8f0] px-2 py-1.5 rounded-lg text-sm text-center font-bold outline-none focus:border-[#2563eb] transition-all" />
                        <button onClick={() => setDeleteConfirm({ type: 'question', idx })} className="p-1 shrink-0 text-[#cbd5e1] hover:text-red-500 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden flex flex-col flex-grow min-h-0">
                <div className="px-6 py-3 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/50 shrink-0">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#64748b]" />
                    <span className="text-xs font-bold text-[#1e293b]">Passage Text</span>
                  </div>
                </div>
                <div className="flex-grow flex flex-col">
                  <Editor
                    key={section?.id || 'new'}
                    tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/7.3.0/tinymce.min.js"
                    licenseKey="gpl"
                    value={section?.passageText || ''}
                    onEditorChange={(content) => onUpdateSection && onUpdateSection('passageText', content)}
                    init={{
                      height: '100%',
                      width: '100%',
                      menubar: true,
                      contextmenu: false,
                      extended_valid_elements: 'span[*]',
                      plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'help', 'wordcount'
                      ],
                      toolbar: 'undo redo | blocks | ' +
                        'bold italic forecolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'table | addParagraphIndicator | removeformat | fullscreen | help',
                      setup: (editor) => {
                        editor.ui.registry.addButton('addParagraphIndicator', {
                          text: 'Add Paragraph Indicator',
                          tooltip: 'Add a dropzone for matching headings',
                          onAction: () => {
                            const currentContent = editor.getContent();
                            // Find the highest existing question number to avoid duplicates if one was deleted
                            let maxNum = 0;
                            const regex = /data-question="(\d+)"/g;
                            let match;
                            while ((match = regex.exec(currentContent)) !== null) {
                              const num = parseInt(match[1], 10);
                              if (num > maxNum) maxNum = num;
                            }
                            const nextNum = maxNum + 1;
                            
                            editor.insertContent(`<span class="heading-dropzone" data-question="${nextNum}" style="display: inline-flex; align-items: center; justify-content: center; min-width: 60px; height: 32px; margin: 0 8px; border: 2px dashed #cbd5e1; border-radius: 8px; background-color: #f8fafc; font-size: 14px; font-weight: bold; color: #64748b; vertical-align: middle;" contenteditable="false">${nextNum}</span>&nbsp;`);
                            
                            // Automatically add a question for this paragraph
                            setSafe((prev: any) => {
                              const newQuestions = [...prev.questions];
                              // Generate paragraph letter (A, B, C, etc.) based on the number of existing questions
                              const nextLetter = String.fromCharCode(65 + newQuestions.length);
                              newQuestions.push({ paragraph: `Paragraph ${nextLetter}`, answer: '' });
                              return { ...prev, questions: newQuestions };
                            });
                          }
                        });
                      },
                      content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px } .heading-dropzone { user-select: none; }',
                      table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | tablemergecells tablesplitcells',
                      resize: false,
                    }}
                  />
                </div>
              </div>
            )}
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
                  <h4 className="text-lg font-bold text-[#1e293b] mb-6">{safe.instructions}</h4>
                  
                  <div className="mb-8">
                    <h5 className="text-sm font-bold text-slate-800 mb-4">List of Headings</h5>
                    <div className="flex flex-col gap-2">
                      {safe.headings.map((h: any, idx: number) => (
                        <div key={idx} className="inline-block px-4 py-2 bg-white border border-slate-300 rounded shadow-sm text-sm text-slate-700 font-medium self-start">
                          {h.text || '(Empty heading)'}
                        </div>
                      ))}
                    </div>
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
        title={`Delete ${deleteConfirm?.type === 'heading' ? 'Heading' : 'Question'}?`}
        message={`Are you sure you want to delete this ${deleteConfirm?.type === 'heading' ? 'heading' : 'question'}? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}

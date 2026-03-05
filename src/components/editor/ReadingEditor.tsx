import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  BookOpen, 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Eye, 
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Editor } from '@tinymce/tinymce-react';
import { DB } from '@/src/db/tests';
import { cn } from '@/src/lib/utils';
import { useDebouncedCallback } from '@/src/hooks/useDebounce';
import ConfirmationModal from '@/src/components/common/ConfirmationModal';
import BlockEditorShell from './blocks/BlockEditorShell';
import TestMetadataModal from './TestMetadataModal';

interface ReadingEditorProps {
  testId: string;
  onBack: () => void;
  onPreview?: () => void;
}

export default function ReadingEditor({ testId, onBack, onPreview }: ReadingEditorProps) {
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [isPassageCollapsed, setIsPassageCollapsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteConfirmBlockId, setDeleteConfirmBlockId] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<any>(null);

  useEffect(() => {
    loadTestData();
  }, [testId]);

  const loadTestData = async (preserveIndex = true) => {
    try {
      const data = await DB.loadTest(testId);
      setTest(data);
      if (!preserveIndex) setActiveSectionIndex(0);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBlock = (block: any) => {
    setEditingBlock(block);
  };

  const handleSaveBlock = async (newData: any) => {
    if (!editingBlock) return;
    const section = test.data[activeSectionIndex];
    setIsProcessing(true);
    try {
      await DB.updateBlock(testId, section.id, editingBlock.id, { data: newData });
      setEditingBlock(null);
      await loadTestData();
    } catch (err) {
      console.error("Save block error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingBlock(null);
  };

  const debouncedUpdateSection = useDebouncedCallback(async (sectionId: string, dataToSave: any) => {
    try {
      await DB.updateSection(testId, sectionId, dataToSave);
    } catch (err) {
      console.error("Update section error:", err);
    }
  }, 2000);

  const handleUpdateSection = (field: string, value: any) => {
    if (!test) return;
    const newTest = { ...test };
    const updatedSection = { ...newTest.data[activeSectionIndex], [field]: value };
    newTest.data[activeSectionIndex] = updatedSection;
    setTest(newTest);
    debouncedUpdateSection(updatedSection.id, {
      title: updatedSection.title,
      instructions: updatedSection.instructions,
      passageText: updatedSection.passageText
    });
  };

  const handleAddBlock = async (type: string) => {
    if (!test) return;
    const section = test.data[activeSectionIndex];
    setIsProcessing(true);
    let defaultData: any = { questions: [] };
    if (type === 'mcq_set') defaultData = { questions: [] };
    else if (type === 'gap_fill' || type === 'gap_fill_visual') defaultData = { gaps: [] };
    else if (type === 'matching') defaultData = { items: [] };
    else if (type === 'matching_visual') defaultData = { pairs: [] };
    else if (type === 'tfng') defaultData = { numbering: "", instructions: "", mode: "TFNG", questions: [] };
    else if (type === 'matching_headings') defaultData = { numbering: "", instructions: "Choose the correct heading for each paragraph from the list of headings below.", headings: [], questions: [] };

    try {
      await DB.addBlock(testId, section.id, type, defaultData);
      setIsAddMenuOpen(false);
      await loadTestData();
    } catch (err) {
      console.error("Add block error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBlock = async () => {
    if (!deleteConfirmBlockId) return;
    const section = test.data[activeSectionIndex];
    setIsProcessing(true);
    try {
      await (DB as any).deleteBlock(testId, section.id, deleteConfirmBlockId);
      setDeleteConfirmBlockId(null);
      await loadTestData();
    } catch (err) {
      console.error("Delete block error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMoveBlock = async (blockId: string, direction: 'up' | 'down') => {
    const section = test.data[activeSectionIndex];
    setIsProcessing(true);
    try {
      await (DB as any).moveBlock(testId, section.id, blockId, direction);
      await loadTestData();
    } catch (err) {
      console.error("Move block error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicateBlock = async (blockId: string) => {
    const section = test.data[activeSectionIndex];
    setIsProcessing(true);
    try {
      await (DB as any).duplicateBlock(testId, section.id, blockId);
      await loadTestData();
    } catch (err) {
      console.error("Duplicate block error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePublish = async () => {
    setIsPublishing(true);
    try {
      if (test.status === 'published') {
        await DB.unpublishTest(testId);
      } else {
        await DB.publishTest(testId);
      }
      loadTestData();
    } catch (err) {
      console.error("Publish error:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveMetadata = async (newData: any) => {
    try {
      await DB.updateTest(testId, newData);
      setIsMetadataModalOpen(false);
      loadTestData();
    } catch (err) {
      console.error("Save metadata error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#64748b]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb] mb-4"></div>
        <p>Loading test data...</p>
      </div>
    );
  }

  if (editingBlock) {
    return (
      <BlockEditorShell 
        type={editingBlock.type}
        data={editingBlock.data}
        onSave={handleSaveBlock}
        onCancel={handleCancelEdit}
        section={test?.data?.[activeSectionIndex]}
        onUpdateSection={handleUpdateSection}
      />
    );
  }

  const sections = test?.data || [];
  const activeSection = sections[activeSectionIndex];

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* HEADER */}
      <header className="h-14 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-[#f1f5f9] rounded-lg text-[#64748b] transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="h-6 w-[1px] bg-[#e2e8f0]" />
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsMetadataModalOpen(true)}>
            <h2 className="font-bold text-[#1e293b] truncate max-w-[300px] group-hover:text-[#2563eb] transition-colors">{test.name}</h2>
            <Settings size={14} className="text-[#64748b] opacity-0 group-hover:opacity-100 transition-all" />
          </div>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-bold uppercase tracking-wider">
            Reading
          </span>
          <div className={cn(
            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
            test.status === 'published' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
          )}>
            {test.status}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onPreview}
            className="flex items-center gap-2 px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-xs font-bold text-[#64748b] hover:bg-[#f8fafc] transition-all"
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>
          <button 
            onClick={togglePublish}
            disabled={isPublishing}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm",
              test.status === 'published' 
                ? "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100" 
                : "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
            )}
          >
            {isPublishing ? (
              <div className="w-3 h-3 border-2 border-current border-t-transparent animate-spin rounded-full" />
            ) : (
              test.status === 'published' ? <XCircle size={14} /> : <CheckCircle2 size={14} />
            )}
            <span>{test.status === 'published' ? 'Unpublish' : 'Publish'}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden">
        {/* SIDEBAR - TIMELINE */}
        <aside className="w-60 bg-white border-r border-[#e2e8f0] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-2 space-y-1">
            {sections.map((sec: any, idx: number) => {
              const blockCount = sec.questions?.length || 0;
              const qCount = (sec.questions || []).reduce((sum: number, b: any) => {
                const data = b.data || {};
                if (b.type === 'mcq_set' && data.questionCountMode === 'byCorrectAnswers') {
                  return sum + (data.questions || []).reduce((s: number, q: any) => s + (q.correctIndices?.length || 1), 0);
                }
                if (Array.isArray(data.questions)) return sum + data.questions.length;
                if (Array.isArray(data.gaps)) return sum + data.gaps.length;
                if (Array.isArray(data.items)) return sum + data.items.length;
                if (Array.isArray(data.pairs)) return sum + data.pairs.length;
                return sum;
              }, 0);

              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    debouncedUpdateSection.flush();
                    setActiveSectionIndex(idx);
                  }}
                  className={cn(
                    "w-full p-3 rounded-xl text-left transition-all duration-200 border",
                    activeSectionIndex === idx 
                      ? "bg-[#eff6ff] border-[#2563eb] shadow-sm" 
                      : "bg-white border-transparent hover:bg-[#f8fafc] hover:border-[#e2e8f0]"
                  )}
                >
                  <div className="font-bold text-sm text-[#1e293b] mb-1">
                    {sec.title || `Passage ${idx + 1}`}
                  </div>
                  <div className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider flex items-center gap-1.5">
                    <span>{blockCount} {blockCount === 1 ? 'Block' : 'Blocks'}</span>
                    <span className="w-1 h-1 rounded-full bg-[#cbd5e1]" />
                    <span>{qCount} {qCount === 1 ? 'Question' : 'Questions'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* MAIN WORKSPACE */}
        <main className="flex-grow overflow-y-auto p-8 bg-[#f8fafc]">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* PASSAGE EDITOR */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden flex flex-col" style={{ minHeight: isPassageCollapsed ? 'auto' : '600px' }}>
              <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <BookOpen size={18} className="text-[#64748b]" />
                  <h3 className="text-sm font-bold text-[#1e293b]">Passage Content</h3>
                </div>
                <div className="flex items-center gap-3">
                  {!isPassageCollapsed && (
                    <button 
                      onClick={async () => {
                        setIsProcessing(true);
                        try {
                          await DB.updateSection(testId, activeSection.id, {
                            title: activeSection.title,
                            instructions: activeSection.instructions,
                            passageText: activeSection.passageText
                          });
                        } catch (err) {
                          console.error("Save passage error:", err);
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      className="bg-[#2563eb] text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[#1d4ed8] transition-all shadow-sm"
                    >
                      Save Passage
                    </button>
                  )}
                  <button 
                    onClick={() => setIsPassageCollapsed(!isPassageCollapsed)}
                    className="p-1.5 hover:bg-white rounded-lg text-[#64748b] transition-all border border-transparent hover:border-[#e2e8f0]"
                  >
                    {isPassageCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </button>
                </div>
              </div>
              
              <AnimatePresence initial={false}>
                {!isPassageCollapsed && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-grow flex flex-col"
                  >
                    <div className="p-6 flex-grow flex flex-col space-y-4">
                      <div className="grid grid-cols-2 gap-4 shrink-0">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Passage Title</label>
                          <input 
                            type="text"
                            value={activeSection?.title || ''}
                            onChange={(e) => handleUpdateSection('title', e.target.value)}
                            placeholder="e.g. Section 1"
                            className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Instructions</label>
                          <input 
                            type="text"
                            value={activeSection?.instructions || ''}
                            onChange={(e) => handleUpdateSection('instructions', e.target.value)}
                            placeholder="e.g. Read the passage below and answer questions 1-13."
                            className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 flex-grow flex flex-col">
                        <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider shrink-0">Passage Text</label>
                        <div className="rounded-xl border border-[#e2e8f0] flex-grow flex flex-col">
                          <Editor
                            key={activeSection?.id || 'new'}
                            tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/7.3.0/tinymce.min.js"
                            licenseKey="gpl"
                            value={activeSection?.passageText || ''}
                            onEditorChange={(content) => handleUpdateSection('passageText', content)}
                            init={{
                              min_height: 400,
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
                                'table | removeformat | fullscreen | help',
                              content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px } .heading-dropzone { user-select: none; }',
                              table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | tablemergecells tablesplitcells',
                              resize: true,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* QUESTION BLOCKS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1e293b]">Question Blocks</h3>
                <div className="relative">
                  <button 
                    onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                    className="flex items-center gap-2 bg-white border border-[#e2e8f0] px-4 py-2 rounded-lg text-xs font-bold text-[#1e293b] hover:border-[#2563eb] hover:text-[#2563eb] transition-all shadow-sm"
                  >
                    <Plus size={16} />
                    <span>Add Question Block</span>
                  </button>
                  
                  <AnimatePresence>
                    {isAddMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsAddMenuOpen(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#e2e8f0] rounded-xl shadow-xl z-20 overflow-hidden py-1"
                        >
                          {[
                            { id: 'mcq_set', label: 'MCQ Set' },
                            { id: 'gap_fill', label: 'Gap Fill' },
                            { id: 'gap_fill_visual', label: 'Gap Fill (Visual)' },
                            { id: 'matching', label: 'Matching' },
                            { id: 'matching_visual', label: 'Matching (Visual)' },
                            { id: 'tfng', label: 'True/False/Not Given' },
                            { id: 'matching_headings', label: 'Matching Headings' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleAddBlock(item.id)}
                              className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#1e293b] hover:bg-[#f8fafc] hover:text-[#2563eb] flex items-center justify-between transition-colors"
                            >
                              <span>{item.label}</span>
                              <Plus size={14} className="opacity-40" />
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-3">
                {activeSection?.questions?.length > 0 ? (
                  activeSection.questions.map((block: any, idx: number) => (
                    <BlockItem 
                      key={block.id}
                      block={block}
                      isFirst={idx === 0}
                      isLast={idx === activeSection.questions.length - 1}
                      onEdit={() => handleEditBlock(block)}
                      onDuplicate={() => handleDuplicateBlock(block.id)}
                      onMoveUp={() => handleMoveBlock(block.id, 'up')}
                      onMoveDown={() => handleMoveBlock(block.id, 'down')}
                      onDelete={() => setDeleteConfirmBlockId(block.id)}
                    />
                  ))
                ) : (
                  <div className="bg-white border border-dashed border-[#e2e8f0] rounded-2xl p-12 text-center">
                    <Edit3 className="mx-auto text-[#cbd5e1] mb-3" size={32} />
                    <p className="text-sm text-[#64748b]">No question blocks yet. Start by adding a block type.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <TestMetadataModal 
        isOpen={isMetadataModalOpen}
        onClose={() => setIsMetadataModalOpen(false)}
        test={test}
        onSave={handleSaveMetadata}
      />

      {/* PROCESSING INDICATOR */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/60 backdrop-blur-[1px] z-[100] flex items-center justify-center"
          >
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-[#e2e8f0] flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#2563eb] animate-spin" />
              <p className="text-sm font-bold text-[#1e293b]">Processing...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BLOCK DELETE CONFIRMATION */}
      <ConfirmationModal 
        isOpen={!!deleteConfirmBlockId}
        onClose={() => setDeleteConfirmBlockId(null)}
        onConfirm={handleDeleteBlock}
        title="Delete Question Block?"
        message="This action cannot be undone. All questions and data within this block will be permanently removed."
        confirmText="Delete Block"
        isLoading={isProcessing}
      />
    </div>
  );
}

function BlockItem({ 
  block, 
  isFirst, 
  isLast, 
  onEdit, 
  onDuplicate, 
  onMoveUp, 
  onMoveDown, 
  onDelete 
}: any) {
  const typeLabels: Record<string, string> = {
    mcq_set: 'MCQ Set',
    gap_fill: 'Gap Fill',
    matching: 'Matching',
    matching_visual: 'Matching (Visual)',
    gap_fill_visual: 'Gap Fill (Visual)',
    tfng: 'TFNG / YNNG',
    matching_headings: 'Matching Headings'
  };

  const countUnits = (data: any, type: string) => {
    if (!data) return 0;
    if (type === 'mcq_set' && data.questionCountMode === 'byCorrectAnswers') {
      return (data.questions || []).reduce((sum: number, q: any) => sum + (q.correctIndices?.length || 1), 0);
    }
    if (Array.isArray(data.questions)) return data.questions.length;
    if (Array.isArray(data.gaps)) return data.gaps.length;
    if (Array.isArray(data.items)) return data.items.length;
    if (Array.isArray(data.pairs)) return data.pairs.length;
    return 0;
  };

  const qCount = countUnits(block.data, block.type);

  return (
    <div className="group bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center justify-between transition-all hover:border-[#2563eb] hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#f8fafc] flex items-center justify-center text-[#2563eb] font-bold text-lg group-hover:bg-[#eff6ff]">
          {block.type.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-bold text-sm text-[#1e293b]">
            {typeLabels[block.type] || block.type}
            {qCount > 0 && <span className="ml-2 text-[#64748b] font-medium">({qCount})</span>}
          </div>
          <div className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider mt-0.5">
            {qCount} {qCount === 1 ? 'Question' : 'Questions'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={onEdit}
          className="p-2 hover:bg-[#f1f5f9] rounded-lg text-[#64748b] hover:text-[#2563eb] transition-all"
          title="Edit Content"
        >
          <Edit3 size={16} />
        </button>
        <button 
          onClick={onDuplicate}
          className="p-2 hover:bg-[#f1f5f9] rounded-lg text-[#64748b] hover:text-[#2563eb] transition-all"
          title="Duplicate"
        >
          <Copy size={16} />
        </button>
        <button 
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-2 hover:bg-[#f1f5f9] rounded-lg text-[#64748b] hover:text-[#2563eb] transition-all disabled:opacity-20"
          title="Move Up"
        >
          <ArrowUp size={16} />
        </button>
        <button 
          onClick={onMoveDown}
          disabled={isLast}
          className="p-2 hover:bg-[#f1f5f9] rounded-lg text-[#64748b] hover:text-[#2563eb] transition-all disabled:opacity-20"
          title="Move Down"
        >
          <ArrowDown size={16} />
        </button>
        <div className="w-[1px] h-4 bg-[#e2e8f0] mx-1" />
        <button 
          onClick={onDelete}
          className="p-2 hover:bg-red-50 rounded-lg text-[#64748b] hover:text-red-600 transition-all"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

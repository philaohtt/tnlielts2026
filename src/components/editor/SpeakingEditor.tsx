import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Mic, 
  Eye, 
  CheckCircle2, 
  XCircle,
  MessageSquare,
  FileText,
  Settings,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DB } from '@/src/db/tests';
import { cn } from '@/src/lib/utils';
import { useDebouncedCallback } from '@/src/hooks/useDebounce';
import TestMetadataModal from './TestMetadataModal';

interface SpeakingEditorProps {
  testId: string;
  onBack: () => void;
  onPreview?: () => void;
}

export default function SpeakingEditor({ testId, onBack, onPreview }: SpeakingEditorProps) {
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const debouncedUpdateSection = useDebouncedCallback(async (field: string, value: any) => {
    if (!test) return;
    const section = test.data[activeSectionIndex];
    try {
      await DB.updateSection(testId, section.id, { [field]: value });
    } catch (err) {
      console.error("Update section error:", err);
    }
  }, 5000);

  const handleUpdateSection = (field: string, value: any) => {
    if (!test) return;
    const newTest = { ...test };
    newTest.data[activeSectionIndex][field] = value;
    setTest(newTest);
    debouncedUpdateSection(field, value);
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
          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded text-[10px] font-bold uppercase tracking-wider">
            Speaking
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
              const meta = idx === 0 ? "Introduction" : (idx === 1 ? "Long Turn" : "Discussion");
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionIndex(idx)}
                  className={cn(
                    "w-full p-3 rounded-xl text-left transition-all duration-200 border",
                    activeSectionIndex === idx 
                      ? "bg-[#eff6ff] border-[#2563eb] shadow-sm" 
                      : "bg-white border-transparent hover:bg-[#f8fafc] hover:border-[#e2e8f0]"
                  )}
                >
                  <div className="font-bold text-sm text-[#1e293b] mb-1">
                    {sec.title || `Part ${idx + 1}`}
                  </div>
                  <div className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider">
                    {meta}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* MAIN WORKSPACE */}
        <main className="flex-grow overflow-y-auto p-8 bg-[#f8fafc]">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 shadow-sm space-y-8">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Part Title</label>
                <input 
                  type="text"
                  value={activeSection?.title || ''}
                  onChange={(e) => handleUpdateSection('title', e.target.value)}
                  placeholder="e.g. Part 1 - Introduction & Interview"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-sm font-medium outline-none focus:border-[#2563eb] focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Examiner Script / Candidate Prompts</label>
                  <div className="flex items-center gap-2 text-[10px] text-[#64748b] font-medium">
                    <MessageSquare size={12} />
                    <span>Plain text only</span>
                  </div>
                </div>
                <textarea 
                  value={activeSection?.instructions || ''}
                  onChange={(e) => handleUpdateSection('instructions', e.target.value)}
                  placeholder="Enter the examiner script, interview questions, or cue card details here..."
                  className="w-full px-4 py-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-base leading-relaxed outline-none focus:border-[#2563eb] focus:bg-white transition-all min-h-[400px] resize-none shadow-inner"
                />
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <FileText size={18} className="text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    This text is displayed to the candidate or examiner depending on the mode. 
                    No complex block logic is required for Speaking tests as they are conducted live.
                  </p>
                </div>
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
    </div>
  );
}

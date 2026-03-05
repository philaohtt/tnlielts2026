import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  FileEdit, 
  Eye, 
  Copy, 
  Trash2, 
  Clock, 
  BookOpen,
  AlertCircle,
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmationModal from '@/src/components/common/ConfirmationModal';
import { EXAMS } from '@/src/db/exams';
import { cn } from '@/src/lib/utils';
import ExamEditor from './ExamEditor';

interface Exam {
  id: string;
  title: string;
  status: string;
  components: any[];
  rules: any;
  updatedAt?: any;
  createdAt?: any;
}

export default function ExamPackagesShell() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Create Modal State
  const [newTitle, setNewTitle] = useState('');

  const loadExams = async () => {
    try {
      setLoading(true);
      const data = await EXAMS.listExams();
      setExams(data as Exam[]);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load exams:", err);
      setError("Failed to load exams. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      setIsProcessing(true);
      const payload = {
        title: newTitle.trim(),
        components: [],
        rules: { timeLimitMin: 180, attemptsAllowed: null }
      };
      const newId = await EXAMS.createExam(payload);
      setIsCreateModalOpen(false);
      setNewTitle('');
      await loadExams();
      setEditingExamId(newId);
    } catch (err: any) {
      console.error("Failed to create exam:", err);
      alert("Failed to create exam: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsProcessing(true);
      await EXAMS.deleteExam(id);
      setDeleteConfirmId(null);
      await loadExams();
    } catch (err: any) {
      console.error("Failed to delete exam:", err);
      alert("Failed to delete exam: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      setIsProcessing(true);
      await EXAMS.duplicateExam(id);
      await loadExams();
    } catch (err: any) {
      console.error("Failed to duplicate exam:", err);
      alert("Failed to duplicate exam: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredExams = exams.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (editingExamId) {
    return (
      <div className="fixed inset-0 z-[100] bg-white">
        <ExamEditor examId={editingExamId} onBack={() => { setEditingExamId(null); loadExams(); }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <div className="px-8 py-6 border-b border-[#e2e8f0] bg-white shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[26px] font-bold text-[#1e293b] tracking-tight mb-1.5">Exam Packages</h1>
            <p className="text-[#64748b] text-sm">Create and manage complete mock exams.</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Create Exam</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#cbd5e1]" size={18} />
            <input 
              type="text" 
              placeholder="Search exams by title or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex-grow p-8 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#64748b]">
            <Loader2 className="w-8 h-8 text-[#2563eb] animate-spin mb-4" />
            <p className="font-medium">Loading exams...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#ef4444]">
            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-medium">{error}</p>
            <button onClick={loadExams} className="mt-4 px-4 py-2 bg-[#ef4444]/10 text-[#ef4444] rounded-lg font-bold text-sm hover:bg-[#ef4444]/20 transition-colors">
              Try Again
            </button>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#64748b] bg-white rounded-2xl border border-[#e2e8f0] border-dashed">
            <BookOpen className="w-12 h-12 mb-4 text-[#cbd5e1]" />
            <p className="font-medium text-[#1e293b] mb-1">No exams found</p>
            <p className="text-sm mb-6">Create a new exam package to get started.</p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="text-[#2563eb] font-bold text-sm hover:underline"
            >
              + Create Exam
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredExams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                <div className="p-5 border-b border-[#e2e8f0] bg-slate-50/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        "bg-blue-100 text-blue-600"
                      )}>
                        <BookOpen size={16} />
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        exam.status === 'published' ? "bg-emerald-100 text-emerald-700" :
                        exam.status === 'ready' ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {exam.status}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-[#1e293b] text-lg mb-1 line-clamp-1" title={exam.title}>{exam.title}</h3>
                  <div className="text-xs font-mono text-[#64748b]">{exam.id}</div>
                </div>
                
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#64748b] flex items-center gap-1.5"><BookOpen size={14} /> Components</span>
                      <span className="font-semibold text-[#1e293b]">{exam.components?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#64748b] flex items-center gap-1.5"><Clock size={14} /> Time Limit</span>
                      <span className="font-semibold text-[#1e293b]">{exam.rules?.timeLimitMin || 'N/A'} min</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-4 border-t border-[#e2e8f0]">
                    <button 
                      onClick={() => setEditingExamId(exam.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#f8fafc] hover:bg-[#eff6ff] text-[#2563eb] rounded-xl text-sm font-bold transition-colors border border-[#e2e8f0] hover:border-[#bfdbfe]"
                    >
                      <FileEdit size={16} />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDuplicate(exam.id)}
                      className="p-2 text-[#64748b] hover:text-[#2563eb] hover:bg-[#eff6ff] rounded-xl transition-colors border border-transparent hover:border-[#bfdbfe]"
                      title="Duplicate"
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(exam.id)}
                      className="p-2 text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#e2e8f0]">
                <h2 className="text-xl font-bold text-[#1e293b]">Create New Exam</h2>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 text-[#64748b] hover:bg-[#f1f5f9] rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1e293b]">Exam Title</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. IELTS Academic Mock Test 1"
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-[#e2e8f0] bg-slate-50">
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-[#64748b] hover:text-[#1e293b] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || isProcessing}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>Create Exam</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {deleteConfirmId && (
        <ConfirmationModal
          title="Delete Exam"
          message="Are you sure you want to delete this exam? This action cannot be undone."
          confirmText="Delete Exam"
          onConfirm={() => handleDelete(deleteConfirmId)}
          onClose={() => setDeleteConfirmId(null)}
          isDestructive={true}
        />
      )}
    </div>
  );
}

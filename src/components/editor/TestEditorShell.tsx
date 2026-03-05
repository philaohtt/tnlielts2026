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
  Headphones,
  Mic,
  PenTool,
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmationModal from '@/src/components/common/ConfirmationModal';
import { DB } from '@/src/db/tests';
import { cn } from '@/src/lib/utils';

interface Test {
  id: string;
  name: string;
  skill: string;
  status: string;
  totalSections: number;
  totalTimeMin: number;
  audioMode?: string;
  updatedAt?: any;
  createdAt?: any;
}

export default function TestEditorShell({ onOpenEditor, onOpenPreview }: { onOpenEditor: (id: string, skill: string) => void, onOpenPreview: (id: string) => void }) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Create Modal State
  const [newName, setNewName] = useState('');
  const [newSkill, setNewSkill] = useState('Listening');
  const [newSections, setNewSections] = useState(4);
  const [newTime, setNewTime] = useState(30);
  const [newAudioMode, setNewAudioMode] = useState('section');

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    try {
      const data = await DB.listTests();
      setTests(data as Test[]);
      setError(null);
    } catch (err: any) {
      console.error("Load error:", err);
      setError(err.message || "Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsProcessing(true);

    const payload: any = {
      name: newName.trim(),
      skill: newSkill,
      testType: newSkill,
      status: 'draft',
      totalSections: newSections,
      totalTimeMin: newTime,
    };

    if (newSkill === 'Listening') {
      payload.audioMode = newAudioMode;
    }

    try {
      const newId = await DB.createTest(payload);
      setIsCreateModalOpen(false);
      onOpenEditor(newId, newSkill);
    } catch (err) {
      console.error("Create error:", err);
      alert("Failed to create test.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsProcessing(true);
    try {
      await DB.deleteTest(id);
      setDeleteConfirmId(null);
      await loadTests();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete test. Check console for details.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    setIsProcessing(true);
    try {
      await DB.duplicateTest(id);
      await loadTests();
    } catch (err) {
      console.error("Duplicate error:", err);
      alert("Failed to duplicate test.");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateModalDefaults = (skill: string) => {
    setNewSkill(skill);
    if (skill === 'Listening') {
      setNewSections(4);
      setNewTime(30);
      setNewAudioMode('section');
    } else if (skill === 'Reading') {
      setNewSections(3);
      setNewTime(60);
    } else if (skill === 'Writing') {
      setNewSections(2);
      setNewTime(60);
    } else if (skill === 'Speaking') {
      setNewSections(3);
      setNewTime(15);
    }
  };

  const filteredTests = tests.filter(t => {
    const matchesSearch = (t.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkill = skillFilter === '' || t.skill === skillFilter;
    return matchesSearch && matchesSkill;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#1e293b] tracking-tight mb-1.5">Test Editor</h1>
          <p className="text-[#64748b] text-sm">Manage, create, and configure your mock tests.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#cbd5e1]" size={16} />
            <input 
              type="text" 
              placeholder="Search tests..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#e2e8f0] bg-white text-sm outline-none focus:border-[#2563eb] transition-all"
            />
          </div>
          <select 
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#e2e8f0] bg-white text-sm outline-none focus:border-[#2563eb] transition-all"
          >
            <option value="">All Skills</option>
            <option value="Listening">Listening</option>
            <option value="Reading">Reading</option>
            <option value="Writing">Writing</option>
            <option value="Speaking">Speaking</option>
          </select>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#1d4ed8] transition-all shadow-sm"
          >
            <Plus size={18} />
            <span>New Test</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#64748b]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb] mb-4"></div>
          <p>Loading tests...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-3" size={40} />
          <h3 className="text-red-900 font-bold mb-1">Error Loading Data</h3>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <button 
            onClick={loadTests}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-all"
          >
            Retry
          </button>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e2e8f0] rounded-xl p-20 text-center">
          <BookOpen className="mx-auto text-[#cbd5e1] mb-4" size={48} />
          <h3 className="text-[#1e293b] font-bold text-lg mb-1">No tests found</h3>
          <p className="text-[#64748b] text-sm mb-6">Create your first test to get started.</p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#2563eb] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-[#1d4ed8] transition-all shadow-md"
          >
            Create New Test
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTests.map((test) => (
                <TestCard 
                  key={test.id} 
                  test={test} 
                  onOpen={() => onOpenEditor(test.id, test.skill)}
                  onPreview={() => onOpenPreview(test.id)}
                  onDuplicate={() => handleDuplicate(test.id)}
                  onDelete={() => setDeleteConfirmId(test.id)}
                />
              ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
                <h3 className="font-bold text-lg text-[#1e293b]">Create New Test</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-[#64748b] hover:text-[#1e293b]">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Skill Module</label>
                  <select 
                    value={newSkill}
                    onChange={(e) => updateModalDefaults(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                  >
                    <option value="Listening">Listening</option>
                    <option value="Reading">Reading</option>
                    <option value="Writing">Writing</option>
                    <option value="Speaking">Speaking</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Test Title</label>
                  <input 
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Cambridge 18 - Test 1"
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Sections</label>
                    <input 
                      type="number"
                      value={newSections}
                      onChange={(e) => setNewSections(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Time (mins)</label>
                    <input 
                      type="number"
                      value={newTime}
                      onChange={(e) => setNewTime(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {newSkill === 'Listening' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Audio Mode</label>
                    <select 
                      value={newAudioMode}
                      onChange={(e) => setNewAudioMode(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                    >
                      <option value="section">Split by Section (Standard)</option>
                      <option value="whole">Single Full Audio File</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex justify-end gap-3">
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-[#64748b] hover:text-[#1e293b] transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate}
                  className="bg-[#2563eb] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#1d4ed8] transition-all shadow-md"
                >
                  Create Test
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal 
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Delete Test?"
        message="This will permanently delete the test and all its questions. This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isProcessing}
      />

      {/* Processing Indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[#2563eb]/20 border-t-[#2563eb] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="text-[#2563eb] animate-pulse" size={24} />
                </div>
              </div>
              <p className="mt-6 text-[#1e293b] font-bold tracking-tight">Processing...</p>
              <p className="mt-1 text-[#64748b] text-xs">Please wait while we update your tests.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TestCard({ test, onOpen, onPreview, onDuplicate, onDelete }: { test: Test, onOpen: () => void, onPreview: () => void, onDuplicate: () => void, onDelete: () => void }) {
  const skillIcons: Record<string, any> = {
    Listening: Headphones,
    Reading: BookOpen,
    Writing: PenTool,
    Speaking: Mic
  };

  const skillColors: Record<string, string> = {
    Listening: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Reading: "bg-blue-50 text-blue-700 border-blue-100",
    Writing: "bg-orange-50 text-orange-700 border-orange-100",
    Speaking: "bg-purple-50 text-purple-700 border-purple-100"
  };

  const Icon = skillIcons[test.skill] || BookOpen;

  return (
    <div className="group bg-white border border-[#e2e8f0] rounded-2xl p-5 flex flex-col transition-all duration-300 hover:border-[#2563eb] hover:shadow-xl hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider", skillColors[test.skill])}>
          {test.skill}
        </div>
        <div className={cn(
          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
          test.status === 'published' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
        )}>
          {test.status}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", skillColors[test.skill].split(' ')[0])}>
          <Icon size={20} />
        </div>
        <h3 className="font-bold text-[#1e293b] leading-tight group-hover:text-[#2563eb] transition-colors line-clamp-2">
          {test.name}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 pt-4 border-t border-[#f1f5f9]">
        <div className="flex items-center gap-2 text-[#64748b]">
          <FileEdit size={14} />
          <span className="text-xs font-medium"><strong>{test.totalSections}</strong> Sections</span>
        </div>
        <div className="flex items-center gap-2 text-[#64748b]">
          <Clock size={14} />
          <span className="text-xs font-medium"><strong>{test.totalTimeMin}</strong> Min</span>
        </div>
        {test.skill === 'Listening' && (
          <div className="col-span-2 flex items-center gap-2 text-[#64748b]">
            <Headphones size={14} />
            <span className="text-xs font-medium">Audio: {test.audioMode === 'whole' ? 'Single File' : 'Split Sections'}</span>
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button 
          onClick={onOpen}
          className="flex-grow bg-[#2563eb] text-white py-2 rounded-xl text-xs font-bold hover:bg-[#1d4ed8] transition-all shadow-sm"
        >
          Open Editor
        </button>
        <button 
          onClick={onDuplicate}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#e2e8f0] text-[#64748b] hover:border-[#2563eb] hover:text-[#2563eb] transition-all"
          title="Duplicate"
        >
          <Copy size={16} />
        </button>
        <button 
          onClick={onPreview}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#e2e8f0] text-[#64748b] hover:border-[#2563eb] hover:text-[#2563eb] transition-all"
          title="Preview"
        >
          <Eye size={16} />
        </button>
        <button 
          onClick={onDelete}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#e2e8f0] text-[#64748b] hover:border-red-500 hover:text-red-500 transition-all"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

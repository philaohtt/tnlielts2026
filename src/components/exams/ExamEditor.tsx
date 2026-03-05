import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Save, 
  Plus, 
  Trash2, 
  GripVertical, 
  Settings2, 
  BookOpen,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { EXAMS } from '@/src/db/exams';
import { DB } from '@/src/db/tests';
import { cn } from '@/src/lib/utils';
import ConfirmationModal from '@/src/components/common/ConfirmationModal';

interface ExamEditorProps {
  examId: string;
  onBack: () => void;
}

export default function ExamEditor({ examId, onBack }: ExamEditorProps) {
  const [exam, setExam] = useState<any>(null);
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [examData, testsData] = await Promise.all([
          EXAMS.getExam(examId),
          DB.listTests()
        ]);
        if (!examData) throw new Error("Exam not found");
        setExam(examData);
        setAvailableTests(testsData.filter(t => t.status === 'published' || t.status === 'ready'));
      } catch (err: any) {
        console.error("Failed to load exam editor data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [examId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await EXAMS.updateExam(examId, exam);
      alert("Exam saved successfully!");
    } catch (err: any) {
      console.error("Failed to save exam:", err);
      alert("Failed to save exam: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddComponent = () => {
    if (!selectedTestId) return;
    const test = availableTests.find(t => t.id === selectedTestId);
    if (!test) return;

    const newComponent = {
      id: `comp_${Date.now()}`,
      testId: test.id,
      titleSnapshot: test.name || test.title || 'Untitled Test',
      nameSnapshot: test.name || test.title || 'Untitled Test',
      skillSnapshot: test.skill || 'Listening',
      updatedAtSnapshot: new Date().toISOString(),
      testUpdatedAt: test.updatedAt?.toDate?.()?.toISOString() || test.updatedAt || new Date().toISOString(),
      timeLimitMin: test.totalTimeMin || 30,
      attempts: 1
    };

    setExam({
      ...exam,
      components: [...(exam.components || []), newComponent]
    });
    setIsAddModalOpen(false);
    setSelectedTestId('');
  };

  const handleRemoveComponent = (index: number) => {
    const newComponents = [...(exam.components || [])];
    newComponents.splice(index, 1);
    setExam({ ...exam, components: newComponents });
  };

  const handleMoveComponent = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === (exam.components?.length || 0) - 1) return;

    const newComponents = [...(exam.components || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newComponents[index];
    newComponents[index] = newComponents[targetIndex];
    newComponents[targetIndex] = temp;

    setExam({ ...exam, components: newComponents });
  };

  const handleRefreshSnapshot = async (index: number) => {
    try {
      const res = await EXAMS.refreshComponentSnapshot(examId, index);
      if (res.success && res.updated) {
        const newComponents = [...(exam.components || [])];
        newComponents[index] = res.updated;
        setExam({ ...exam, components: newComponents });
      } else {
        alert("Failed to refresh: " + res.error);
      }
    } catch (err: any) {
      alert("Failed to refresh: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#f8fafc] text-[#64748b]">
        <Loader2 className="w-8 h-8 text-[#2563eb] animate-spin mb-4" />
        <p className="font-medium">Loading exam...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#f8fafc] text-[#ef4444]">
        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
        <p className="font-medium">{error || "Exam not found"}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-[#ef4444]/10 text-[#ef4444] rounded-lg font-bold text-sm hover:bg-[#ef4444]/20 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* HEADER */}
      <header className="h-[70px] bg-white border-b border-[#e2e8f0] flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-[#f1f5f9] rounded-xl text-[#64748b] transition-all flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            <span className="font-bold text-sm">Back</span>
          </button>
          <div className="h-6 w-[1px] bg-[#e2e8f0]" />
          <div>
            <h1 className="font-bold text-[#1e293b] text-lg">{exam.title}</h1>
            <div className="text-xs text-[#64748b] font-medium uppercase tracking-wider">
              Exam Package • {exam.status}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Save Changes</span>
          </button>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* General Settings */}
          <section className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e2e8f0] bg-slate-50/50 flex items-center gap-2">
              <Settings2 size={18} className="text-[#64748b]" />
              <h2 className="font-bold text-[#1e293b]">General Settings</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1e293b]">Exam Title</label>
                <input 
                  type="text" 
                  value={exam.title}
                  onChange={(e) => setExam({ ...exam, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1e293b]">Total Time Limit (Minutes)</label>
                <input 
                  type="number" 
                  value={exam.rules?.timeLimitMin || ''}
                  onChange={(e) => setExam({ ...exam, rules: { ...exam.rules, timeLimitMin: parseInt(e.target.value) || 0 } })}
                  className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                />
              </div>
            </div>
          </section>

          {/* Components */}
          <section className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e2e8f0] bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-[#64748b]" />
                <h2 className="font-bold text-[#1e293b]">Exam Components</h2>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="text-[#2563eb] hover:bg-[#eff6ff] px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} />
                Add Component
              </button>
            </div>
            
            <div className="p-6">
              {(!exam.components || exam.components.length === 0) ? (
                <div className="text-center py-12 border-2 border-dashed border-[#e2e8f0] rounded-xl bg-[#f8fafc]">
                  <p className="text-[#64748b] font-medium mb-2">No components added yet</p>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="text-[#2563eb] font-bold text-sm hover:underline"
                  >
                    + Add your first test
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {exam.components.map((comp: any, idx: number) => (
                    <div key={comp.id || idx} className="flex items-center gap-4 p-4 border border-[#e2e8f0] rounded-xl bg-white shadow-sm group">
                      <div className="flex flex-col gap-1 text-[#cbd5e1]">
                        <button 
                          onClick={() => handleMoveComponent(idx, 'up')}
                          disabled={idx === 0}
                          className="hover:text-[#64748b] disabled:opacity-30"
                        >
                          <GripVertical size={16} />
                        </button>
                        <button 
                          onClick={() => handleMoveComponent(idx, 'down')}
                          disabled={idx === exam.components.length - 1}
                          className="hover:text-[#64748b] disabled:opacity-30"
                        >
                          <GripVertical size={16} />
                        </button>
                      </div>
                      
                      <div className="flex-grow min-w-0 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#eff6ff] text-[#2563eb] flex items-center justify-center shrink-0 font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-[#1e293b] text-base truncate">{comp.titleSnapshot || comp.nameSnapshot}</h4>
                          <div className="flex items-center gap-3 text-xs text-[#64748b] mt-1">
                            <span className="font-medium px-2 py-0.5 bg-slate-100 rounded-md uppercase tracking-wider">{comp.skillSnapshot}</span>
                            <span>{comp.timeLimitMin} min</span>
                            <span className="font-mono text-[10px]">{comp.testId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => handleRefreshSnapshot(idx)}
                          className="p-2 text-[#64748b] hover:text-[#2563eb] hover:bg-[#eff6ff] rounded-lg transition-colors"
                          title="Refresh Snapshot"
                        >
                          <RefreshCw size={16} />
                        </button>
                        <button 
                          onClick={() => handleRemoveComponent(idx)}
                          className="p-2 text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Component"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

      {/* Add Component Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#e2e8f0]">
              <h2 className="text-xl font-bold text-[#1e293b]">Add Test Component</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-[#64748b] hover:bg-[#f1f5f9] rounded-xl transition-colors"
              >
                <Trash2 size={20} className="hidden" /> {/* Placeholder for spacing */}
                <span className="font-bold text-sm">Cancel</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1e293b]">Select Test</label>
                <select 
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                >
                  <option value="">-- Select a test --</option>
                  {availableTests.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.skill}] {t.name || t.title} ({t.id})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#64748b] mt-2">Only published or ready tests are available.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#e2e8f0] bg-slate-50">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-[#64748b] hover:text-[#1e293b] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddComponent}
                disabled={!selectedTestId}
                className="bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2"
              >
                <Plus size={16} />
                <span>Add Component</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

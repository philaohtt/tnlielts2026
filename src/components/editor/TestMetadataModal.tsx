import React, { useState, useEffect } from 'react';
import { X, Settings, Clock, Type, Headphones, BookOpen, PenTool, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface TestMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: any;
  onSave: (newData: any) => void;
}

export default function TestMetadataModal({ isOpen, onClose, test, onSave }: TestMetadataModalProps) {
  const [name, setName] = useState('');
  const [time, setTime] = useState(30);
  const [skill, setSkill] = useState('');
  const [audioMode, setAudioMode] = useState('section');

  useEffect(() => {
    if (test) {
      setName(test.name || '');
      setTime(test.totalTimeMin || 30);
      setSkill(test.skill || '');
      setAudioMode(test.audioMode || 'section');
    }
  }, [test, isOpen]);

  const handleSave = () => {
    const data: any = {
      name,
      totalTimeMin: time,
      skill
    };
    if (skill === 'Listening') {
      data.audioMode = audioMode;
    }
    onSave(data);
  };

  const skillIcons: Record<string, any> = {
    Listening: Headphones,
    Reading: BookOpen,
    Writing: PenTool,
    Speaking: Mic
  };

  const Icon = skillIcons[skill] || Settings;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-center text-[#2563eb] shadow-sm">
                  <Icon size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1e293b]">Test Settings</h2>
                  <p className="text-[10px] text-[#64748b] font-medium uppercase tracking-wider">Configure test metadata</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-[#f1f5f9] rounded-full text-[#64748b] transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-2">
                  <Type size={12} />
                  Test Title
                </label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cambridge 18 - Test 1"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-sm font-medium outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-2">
                    <Clock size={12} />
                    Total Time (mins)
                  </label>
                  <input 
                    type="number"
                    value={time}
                    onChange={(e) => setTime(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-sm font-medium outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-2">
                    <Settings size={12} />
                    Skill Module
                  </label>
                  <select 
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-sm font-medium outline-none focus:border-[#2563eb] focus:bg-white transition-all"
                  >
                    <option value="Listening">Listening</option>
                    <option value="Reading">Reading</option>
                    <option value="Writing">Writing</option>
                    <option value="Speaking">Speaking</option>
                  </select>
                </div>
              </div>

              {skill === 'Listening' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-2">
                    <Headphones size={12} />
                    Audio Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAudioMode('section')}
                      className={cn(
                        "px-4 py-3 rounded-xl border text-xs font-bold transition-all text-center",
                        audioMode === 'section' 
                          ? "bg-[#eff6ff] border-[#2563eb] text-[#2563eb]" 
                          : "bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1]"
                      )}
                    >
                      Split Sections
                    </button>
                    <button
                      onClick={() => setAudioMode('whole')}
                      className={cn(
                        "px-4 py-3 rounded-xl border text-xs font-bold transition-all text-center",
                        audioMode === 'whole' 
                          ? "bg-[#eff6ff] border-[#2563eb] text-[#2563eb]" 
                          : "bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1]"
                      )}
                    >
                      Whole Test
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 py-5 bg-[#f8fafc] border-t border-[#e2e8f0] flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-bold text-[#64748b] hover:text-[#1e293b] transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="bg-[#2563eb] text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-[#1d4ed8] transition-all shadow-lg shadow-blue-200"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

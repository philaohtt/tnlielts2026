/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileEdit, 
  BookOpen, 
  Monitor, 
  UserCircle, 
  Users, 
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import TestEditorShell from './components/editor/TestEditorShell';
import ListeningEditor from './components/editor/ListeningEditor';
import ReadingEditor from './components/editor/ReadingEditor';
import WritingEditor from './components/editor/WritingEditor';
import SpeakingEditor from './components/editor/SpeakingEditor';
import TestPreview from './components/preview/TestPreview';
import ExamPackagesShell from './components/exams/ExamPackagesShell';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'dashboard' | 'proctor' | 'candidate' | 'examiner' | 'editor' | 'exams';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTest, setEditingTest] = useState<{ id: string, skill: string } | null>(null);
  const [previewTestId, setPreviewTestId] = useState<string | null>(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'editor', label: 'Test Editor', icon: FileEdit },
    { id: 'exams', label: 'Exam Packages', icon: BookOpen, external: false },
    { id: 'proctor', label: 'Proctoring', icon: Monitor },
    { id: 'candidate_portal', label: 'Candidate Portal', icon: UserCircle, external: true },
    { id: 'candidates', label: 'Candidates', icon: Users, external: true },
    { id: 'examiner', label: 'Examiner', icon: ShieldCheck, external: true },
  ];

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleOpenEditor = (id: string, skill: string) => {
    setEditingTest({ id, skill });
    setActiveTab('editor');
  };

  const handleCloseEditor = () => {
    setEditingTest(null);
  };

  const handleOpenPreview = (id: string) => {
    setPreviewTestId(id);
  };

  const handleClosePreview = () => {
    setPreviewTestId(null);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc]">
      {/* SIDEBAR */}
      <aside 
        className={cn(
          "sidebar-transition flex flex-col bg-white border-r border-[#e2e8f0] z-50 shrink-0",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="h-[70px] flex items-center px-5 border-b border-[#e2e8f0] overflow-hidden whitespace-nowrap">
          <div className="w-9 h-9 bg-gradient-to-br from-[#2563eb] to-[#1d47b6] rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
            I
          </div>
          {!sidebarCollapsed && (
            <span className="ml-3 font-bold text-base text-[#1e293b] tracking-tight">IELTS Admin</span>
          )}
        </div>

        <nav className="p-2.5 flex-grow">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (!item.external) setActiveTab(item.id as Tab);
              }}
              className={cn(
                "flex items-center w-full p-2.5 mb-1.5 rounded-xl transition-all duration-300 text-sm font-medium",
                !item.external && activeTab === item.id 
                  ? "bg-[#eff6ff] text-[#2563eb] font-semibold border-l-3 border-[#2563eb] pl-[9px]" 
                  : "text-[#64748b] hover:bg-[#f0f4f9] hover:text-[#2563eb]"
              )}
            >
              <item.icon size={20} className="shrink-0" />
              {!sidebarCollapsed && <span className="ml-3 whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2.5 border-t border-[#e2e8f0]">
          <button 
            onClick={toggleSidebar}
            className="flex items-center w-full p-2.5 rounded-xl text-[#64748b] hover:bg-[#f0f4f9] transition-all duration-300 text-sm font-medium"
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!sidebarCollapsed && <span className="ml-3">Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-grow min-w-0 h-screen">
        {/* HEADER */}
        <header className="h-[70px] bg-white border-b border-[#e2e8f0] flex items-center justify-between px-8 shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#cbd5e1]" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm outline-none focus:border-[#2563eb] focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#e2e8f0] hover:border-[#2563eb] hover:bg-[#eff6ff] cursor-pointer transition-all">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1d47b6] flex items-center justify-center font-bold text-white text-xs">
                AD
              </div>
              <span className="text-[13px] font-semibold text-[#1e293b]">Admin User</span>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-8 overflow-y-auto flex-grow">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h1 className="text-[26px] font-bold text-[#1e293b] tracking-tight mb-1.5">Dashboard</h1>
                  <p className="text-[#64748b] text-sm">Manage your IELTS mock test system and track exam operations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <LaunchCard 
                    title="Test Editor"
                    description="Create and manage Listening, Reading, Writing, and Speaking tests. Build comprehensive mock exams with detailed content."
                    icon={<FileEdit size={28} />}
                    color="blue"
                    onClick={() => setActiveTab('editor')}
                  />
                  <LaunchCard 
                    title="Exam Builder"
                    description="Combine multiple skill tests into complete exam packages. Create session bundles for organized test administration."
                    icon={<BookOpen size={28} />}
                    color="amber"
                    onClick={() => setActiveTab('exams')}
                  />
                  <LaunchCard 
                    title="Proctoring"
                    description="Monitor live test sessions in real time. Track candidate progress and manage exam room security and integrity."
                    icon={<Monitor size={28} />}
                    color="emerald"
                    onClick={() => setActiveTab('proctor')}
                  />
                  <LaunchCard 
                    title="Candidate Portal"
                    description="Provide candidates with secure access to exams. Let them check results and review performance feedback."
                    icon={<UserCircle size={28} />}
                    color="purple"
                    onClick={() => console.log('Open Portal')}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'proctor' && (
              <motion.div
                key="proctor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h1 className="text-[26px] font-bold text-[#1e293b] tracking-tight mb-1.5">Session Operations</h1>
                  <p className="text-[#64748b] text-sm">Monitor live sessions and manage exam rooms.</p>
                </div>

                <div className="flex gap-4 mb-6">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-[#2563eb] text-white p-3 rounded-xl font-semibold text-sm hover:bg-[#1d4ed8] transition-all shadow-sm">
                    <Users size={18} />
                    <span>Manage Candidates</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-[#2563eb] text-white p-3 rounded-xl font-semibold text-sm hover:bg-[#1d4ed8] transition-all shadow-sm">
                    <Monitor size={18} />
                    <span>Manage Sessions</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-[#e2e8f0] flex justify-between items-center">
                      <span className="font-semibold text-base text-[#1e293b]">Active Sessions</span>
                      <button className="bg-[#2563eb] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#1d4ed8] transition-all">
                        Create Session
                      </button>
                    </div>
                    <div className="p-12 text-center text-[#64748b]">
                      <Clock size={48} className="mx-auto mb-3 opacity-25" />
                      <p className="text-sm">No sessions are currently scheduled or live.</p>
                    </div>
                  </div>
                  <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Live Monitor</h3>
                    <p className="text-[13px] text-[#64748b] leading-relaxed">
                      Connect to a room to see live activity, candidate status, and session metrics.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'editor' && (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col"
              >
                {editingTest ? (
                  <div className="fixed inset-0 z-[100] bg-white">
                    {editingTest.skill === 'Listening' && (
                      <ListeningEditor testId={editingTest.id} onBack={handleCloseEditor} onPreview={() => handleOpenPreview(editingTest.id)} />
                    )}
                    {editingTest.skill === 'Reading' && (
                      <ReadingEditor testId={editingTest.id} onBack={handleCloseEditor} onPreview={() => handleOpenPreview(editingTest.id)} />
                    )}
                    {editingTest.skill === 'Writing' && (
                      <WritingEditor testId={editingTest.id} onBack={handleCloseEditor} onPreview={() => handleOpenPreview(editingTest.id)} />
                    )}
                    {editingTest.skill === 'Speaking' && (
                      <SpeakingEditor testId={editingTest.id} onBack={handleCloseEditor} onPreview={() => handleOpenPreview(editingTest.id)} />
                    )}
                  </div>
                ) : (
                  <TestEditorShell onOpenEditor={handleOpenEditor} onOpenPreview={handleOpenPreview} />
                )}
              </motion.div>
            )}

            {activeTab === 'exams' && (
              <motion.div
                key="exams"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col"
              >
                <ExamPackagesShell />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* PREVIEW OVERLAY */}
      <AnimatePresence>
        {previewTestId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-white"
          >
            <TestPreview testId={previewTestId} onClose={handleClosePreview} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface LaunchCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'blue' | 'amber' | 'emerald' | 'purple';
  onClick: () => void;
}

function LaunchCard({ title, description, icon, color, onClick }: LaunchCardProps) {
  const colorClasses = {
    blue: "bg-[#eff6ff] text-[#2563eb]",
    amber: "bg-[#fef3c7] text-[#d97706]",
    emerald: "bg-[#dcfce7] text-[#16a34a]",
    purple: "bg-[#f3e8ff] text-[#9333ea]"
  };

  const btnColors = {
    blue: "bg-[#2563eb] hover:bg-[#1d4ed8]",
    amber: "bg-[#d97706] hover:bg-[#b45309]",
    emerald: "bg-[#16a34a] hover:bg-[#15803d]",
    purple: "bg-[#9333ea] hover:bg-[#7e22ce]"
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-7 flex flex-col items-center text-center transition-all duration-200 shadow-sm hover:border-[#2563eb] hover:shadow-lg hover:-translate-y-0.5">
      <div className={cn("w-14 h-14 flex items-center justify-center rounded-xl mb-4", colorClasses[color])}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[#1e293b] mb-2 tracking-tight">{title}</h3>
      <p className="text-[13px] leading-relaxed text-[#64748b] mb-5">{description}</p>
      <button 
        onClick={onClick}
        className={cn("mt-auto w-full py-2 rounded-lg text-white text-[13px] font-bold transition-all flex items-center justify-center gap-2", btnColors[color])}
      >
        <span>Open {title}</span>
        <ExternalLink size={14} />
      </button>
    </div>
  );
}

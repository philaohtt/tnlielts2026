import React from 'react';
import McqSetEditor from './McqSetEditor';
import GapFillEditor from './GapFillEditor';
import MatchingEditor from './MatchingEditor';
import TfngEditor from './TfngEditor';
import MapLabelingEditor from './MapLabelingEditor';
import MatchingCanvasEditor from './MatchingCanvasEditor';
import MatchingHeadingsEditor from './MatchingHeadingsEditor';

interface BlockEditorShellProps {
  type: string;
  data: any;
  onSave: (newData: any) => void;
  onCancel: () => void;
  section?: any;
  onUpdateSection?: (field: string, value: any) => void;
}

export default function BlockEditorShell({ type, data, onSave, onCancel, section, onUpdateSection }: BlockEditorShellProps) {
  switch (type) {
    case 'mcq_set':
      return <McqSetEditor data={data} onSave={onSave} onCancel={onCancel} />;
    case 'gap_fill':
      return <GapFillEditor data={data} onSave={onSave} onCancel={onCancel} />;
    case 'matching':
      return <MatchingEditor data={data} onSave={onSave} onCancel={onCancel} />;
    case 'tfng':
      return <TfngEditor data={data} onSave={onSave} onCancel={onCancel} />;
    case 'map_labeling':
    case 'gap_fill_visual':
      return <MapLabelingEditor type={type} data={data} onSave={onSave} onCancel={onCancel} />;
    case 'matching_visual':
      return <MatchingCanvasEditor type={type} data={data} onSave={onSave} onCancel={onCancel} />;
    case 'matching_headings':
      return <MatchingHeadingsEditor data={data} onSave={onSave} onCancel={onCancel} section={section} onUpdateSection={onUpdateSection} />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full bg-[#f8fafc] text-[#64748b]">
          <p className="font-bold text-lg mb-2">Block Editor Not Implemented</p>
          <p className="text-sm mb-6">The editor for block type "{type}" is coming soon.</p>
          <button 
            onClick={onCancel}
            className="px-6 py-2 bg-white border border-[#e2e8f0] rounded-xl font-bold text-[#1e293b] hover:bg-[#f1f5f9] transition-all"
          >
            Go Back
          </button>
        </div>
      );
  }
}

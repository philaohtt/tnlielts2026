import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Clock, Loader2, AlertCircle } from 'lucide-react';
import { DB } from '@/src/db/tests';
import { cn } from '@/src/lib/utils';
import ReactMarkdown from 'react-markdown';

interface TestPreviewProps {
  testId: string;
  onClose: () => void;
}

const HeadingDropZone = ({ num, matchedHeading, onDrop, onRemove }: any) => {
  const [isOver, setIsOver] = useState(false);

  return (
    <span
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const data = e.dataTransfer.getData('application/json');
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'heading') {
              onDrop(num, parsed);
            }
          } catch (e) {}
        }
      }}
      onClick={() => {
        if (matchedHeading) onRemove(num);
      }}
      className={cn(
        "inline-flex items-center justify-center w-[90%] max-w-[600px] px-4 min-h-[40px] mx-2 my-1 border-2 border-dashed rounded-lg text-sm font-bold transition-colors cursor-pointer align-middle",
        isOver ? "border-[#2563eb] bg-[#eff6ff]" : "border-[#cbd5e1] bg-[#f8fafc]",
        matchedHeading ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]" : "text-[#64748b]"
      )}
    >
      {matchedHeading ? (
        <span className="flex items-center justify-center w-full">
          <span className="font-normal text-sm truncate">{matchedHeading.text}</span>
        </span>
      ) : (
        num
      )}
    </span>
  );
};

export default function TestPreview({ testId, onClose }: TestPreviewProps) {
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [matchedHeadings, setMatchedHeadings] = useState<Record<string, any>>({});
  const [dropzones, setDropzones] = useState<Element[]>([]);

  useEffect(() => {
    if (test && test.data[activeSectionIndex]) {
      setTimeout(() => {
        const zones = Array.from(document.querySelectorAll('.heading-dropzone'));
        setDropzones(zones);
      }, 50);
    }
  }, [test, activeSectionIndex]);

  useEffect(() => {
    const loadTest = async () => {
      try {
        const data = await DB.loadTest(testId);
        setTest(data);
      } catch (err: any) {
        console.error("Failed to load test for preview:", err);
        setError(err.message || "Failed to load test");
      } finally {
        setLoading(false);
      }
    };
    loadTest();
  }, [testId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center text-[#64748b]">
        <Loader2 className="w-8 h-8 text-[#2563eb] animate-spin mb-4" />
        <p>Loading test preview...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-[#1e293b] mb-2">Error Loading Preview</h2>
        <p className="text-[#64748b] mb-6">{error || "Test not found"}</p>
        <button 
          onClick={onClose}
          className="px-6 py-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e293b] font-bold rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const sections = test.data || [];
  const activeSection = sections[activeSectionIndex];

  const renderPassageText = (html: string) => {
    if (!html) return '';
    
    // Find the matching headings block to get the start number
    const matchingHeadingsBlock = activeSection?.questions?.find((q: any) => q.type === 'matching_headings');
    const match = matchingHeadingsBlock?.data?.numbering?.match(/\d+/);
    const startNum = match ? parseInt(match[0], 10) : 1;

    // First, replace any legacy [number] format with the span format
    let processedHtml = html.replace(/\[(\d+)\]/g, '<span class="heading-dropzone" data-question="$1"></span>');
    
    // Then, replace ALL heading-dropzones sequentially with the actual question number
    // and ensure they are empty so the React portal can render the HeadingDropZone inside them
    let dropzoneIndex = 0;
    processedHtml = processedHtml.replace(/(<span[^>]*class="[^"]*heading-dropzone[^"]*"[^>]*data-question=")\d+("[^>]*>)(.*?)(<\/span>)/g, (match, p1, p2, p3, p4) => {
      const actualNum = startNum + dropzoneIndex;
      dropzoneIndex++;
      return `${p1}${actualNum}${p2}${p4}`;
    });

    return processedHtml;
  };

  return (
    <div className="fixed inset-0 bg-[#f8fafc] z-[200] flex flex-col overflow-hidden">
      {/* HEADER */}
      <header className="h-16 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#f1f5f9] rounded-lg text-[#64748b] transition-all flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            <span className="font-bold text-sm">Exit Preview</span>
          </button>
          <div className="h-6 w-[1px] bg-[#e2e8f0]" />
          <div>
            <h1 className="font-bold text-[#1e293b] text-lg">{test.name}</h1>
            <div className="text-xs text-[#64748b] font-medium uppercase tracking-wider">
              {test.skill} Test • Preview Mode
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[#1e293b] font-mono text-lg font-bold bg-[#f1f5f9] px-4 py-1.5 rounded-lg border border-[#e2e8f0]">
            <Clock size={18} className="text-[#2563eb]" />
            <span>{test.totalTimeMin}:00</span>
          </div>
          <button className="bg-[#2563eb] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#1d4ed8] transition-all shadow-sm">
            Submit Test
          </button>
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-white border-r border-[#e2e8f0] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-[#e2e8f0] bg-slate-50">
            <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Test Navigation</h3>
          </div>
          <div className="p-3 space-y-2">
            {sections.map((sec: any, idx: number) => (
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
                  {sec.title || `Section ${idx + 1}`}
                </div>
                <div className="text-xs text-[#64748b]">
                  {sec.questions?.length || 0} Question Blocks
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-grow overflow-hidden flex">
          {test.skill === 'Reading' ? (
            <div className="flex w-full h-full">
              {/* Left Column: Passage */}
              <div className="w-1/2 h-full overflow-y-auto p-8 border-r border-[#e2e8f0] bg-white">
                <div className="max-w-3xl mx-auto">
                  {activeSection ? (
                    <div>
                      <h2 className="text-2xl font-bold text-[#1e293b] mb-4">{activeSection.title}</h2>
                      {activeSection.instructions && (
                        <div className="text-[#475569] text-sm leading-relaxed mb-6">
                          {activeSection.instructions}
                        </div>
                      )}
                      {activeSection.passageText && (
                        <div className="tinymce-content text-[#1e293b] leading-loose" dangerouslySetInnerHTML={{ __html: renderPassageText(activeSection.passageText) }} />
                      )}
                      {dropzones.map((zone, i) => {
                        const num = zone.getAttribute('data-question');
                        if (!num) return null;
                        return createPortal(
                          <HeadingDropZone
                            key={i}
                            num={num}
                            matchedHeading={matchedHeadings[num]}
                            onDrop={(n: string, heading: any) => setMatchedHeadings(prev => ({ ...prev, [n]: heading }))}
                            onRemove={(n: string) => {
                              const newMatched = { ...matchedHeadings };
                              delete newMatched[n];
                              setMatchedHeadings(newMatched);
                            }}
                          />,
                          zone
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-[#64748b] py-12">Select a section to begin</div>
                  )}
                </div>
              </div>
              
              {/* Right Column: Questions */}
              <div className="w-1/2 h-full overflow-y-auto p-8 bg-[#f8fafc]">
                <div className="max-w-3xl mx-auto">
                  {activeSection && (
                    <div className="space-y-12">
                      {activeSection.questions?.map((block: any, idx: number) => (
                        <div key={block.id} className="space-y-4 bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="w-6 h-6 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider">
                              {block.type.replace('_', ' ')}
                            </h3>
                          </div>
                          
                          <div className="pl-8">
                            <BlockPreview block={block} matchedHeadings={matchedHeadings} setMatchedHeadings={setMatchedHeadings} />
                          </div>
                        </div>
                      ))}
                      {(!activeSection.questions || activeSection.questions.length === 0) && (
                        <div className="text-center text-[#64748b] py-12 bg-white rounded-2xl border border-[#e2e8f0]">
                          No questions in this section.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-8">
                {activeSection ? (
                  <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-[#e2e8f0] bg-slate-50">
                      <h2 className="text-2xl font-bold text-[#1e293b] mb-4">{activeSection.title}</h2>
                      {activeSection.instructions && (
                        <div className="text-[#475569] text-sm leading-relaxed mb-6">
                          {activeSection.instructions}
                        </div>
                      )}
                      {activeSection.passageText && (
                        <div className="tinymce-content text-[#1e293b] bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm" dangerouslySetInnerHTML={{ __html: renderPassageText(activeSection.passageText) }} />
                      )}
                      {dropzones.map((zone, i) => {
                        const num = zone.getAttribute('data-question');
                        if (!num) return null;
                        return createPortal(
                          <HeadingDropZone
                            key={i}
                            num={num}
                            matchedHeading={matchedHeadings[num]}
                            onDrop={(n: string, heading: any) => setMatchedHeadings(prev => ({ ...prev, [n]: heading }))}
                            onRemove={(n: string) => {
                              const newMatched = { ...matchedHeadings };
                              delete newMatched[n];
                              setMatchedHeadings(newMatched);
                            }}
                          />,
                          zone
                        );
                      })}
                      {activeSection.promptHtml && (
                        <div className="tinymce-content text-[#1e293b] bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm mt-6" dangerouslySetInnerHTML={{ __html: activeSection.promptHtml }} />
                      )}
                      {activeSection.audio?.url && (
                        <div className="mt-6 p-4 bg-white rounded-xl border border-[#e2e8f0] shadow-sm">
                          <audio src={activeSection.audio.url} controls className="w-full" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-8 space-y-12">
                      {activeSection.questions?.map((block: any, idx: number) => (
                        <div key={block.id} className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="w-6 h-6 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider">
                              {block.type.replace('_', ' ')}
                            </h3>
                          </div>
                          
                          {/* Render block preview based on type */}
                          <div className="pl-8">
                            <BlockPreview block={block} matchedHeadings={matchedHeadings} setMatchedHeadings={setMatchedHeadings} />
                          </div>
                        </div>
                      ))}
                      {(!activeSection.questions || activeSection.questions.length === 0) && (
                        <div className="text-center text-[#64748b] py-12">
                          No questions in this section.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-[#64748b] py-20">
                    No sections found in this test.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function BlockPreview({ block, matchedHeadings, setMatchedHeadings }: { block: any, matchedHeadings?: any, setMatchedHeadings?: any }) {
  const { type, data } = block;

  if (!data) return <div className="text-red-500">Invalid block data</div>;

  switch (type) {
    case 'mcq':
    case 'mcq_set':
      return (
        <div className="space-y-6">
          <div className="text-sm font-bold text-[#2563eb] mb-2">{data.numbering}</div>
          <div className="text-[#1e293b] font-medium mb-6">{data.instruction}</div>
          {data.questions?.map((q: any, i: number) => (
            <div key={q.id || i} className="space-y-3">
              <div className="font-medium text-[#1e293b] flex gap-3">
                <span className="font-bold">{i + 1}.</span>
                <span dangerouslySetInnerHTML={{ __html: q.prompt || q.text || '' }} />
              </div>
              <div className="pl-6 space-y-2">
                {q.options?.map((opt: any, j: number) => (
                  <label key={j} className="flex items-start gap-3 p-3 rounded-xl border border-[#e2e8f0] hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type={data.questionCountMode === 'byCorrectAnswers' && q.correctIndices?.length > 1 ? "checkbox" : "radio"} name={`q_${q.id}`} className="mt-1" />
                    <span className="text-sm text-[#475569]">{typeof opt === 'string' ? opt : opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    case 'tfng':
      return (
        <div className="space-y-6">
          <div className="text-sm font-bold text-[#2563eb] mb-2">{data.numbering}</div>
          <div className="text-[#1e293b] font-medium mb-6">{data.instructions}</div>
          <div className="space-y-4">
            {data.questions?.map((q: any, i: number) => (
              <div key={q.id || i} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="flex gap-4">
                  <span className="font-bold text-[#1e293b]">{i + 1}.</span>
                  <span className="text-sm text-[#1e293b]">{q.statement}</span>
                </div>
                <div className="flex gap-2">
                  {(data.mode === 'YNNG' ? ['YES', 'NO', 'NOT GIVEN'] : ['TRUE', 'FALSE', 'NOT GIVEN']).map((opt) => (
                    <label key={opt} className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors flex items-center gap-2">
                      <input type="radio" name={`tfng_${q.id}`} value={opt} className="hidden" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'gap_fill':
      return (
        <div className="space-y-6">
          <div className="text-sm font-bold text-[#2563eb] mb-2">{data.numbering}</div>
          <div className="text-[#1e293b] font-medium mb-6">{data.instructions}</div>
          <div className="tinymce-content text-[#1e293b] leading-loose">
            {data.passageHtml ? (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: data.passageHtml.replace(/<span class="gap-marker"[^>]*>(.*?)<\/span>/g, (match: string, content: string, offset: number, string: string) => {
                    const indexMatch = match.match(/data-index="([^"]+)"/);
                    const index = indexMatch ? indexMatch[1] : '?';
                    return `<input type="text" placeholder="${index}" class="inline-block w-28 h-8 mx-1 border border-slate-300 rounded-md bg-white px-2 py-1 text-center text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400 placeholder:font-bold shadow-sm" />`;
                  })
                }} 
              />
            ) : (
              // Fallback for older data format
              data.text?.split(/(\[GAP\])/g).map((part: string, i: number) => {
                if (part === '[GAP]') {
                  return <input key={i} type="text" placeholder="?" className="inline-block w-28 h-8 mx-1 border border-slate-300 rounded-md bg-white px-2 py-1 text-center text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400 placeholder:font-bold shadow-sm" />;
                }
                return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
              })
            )}
          </div>
        </div>
      );
    case 'matching_headings':
      const usedHeadingIds = Object.values(matchedHeadings || {}).map((h: any) => h.id);
      return (
        <div className="space-y-6">
          <div className="text-sm font-bold text-[#2563eb] mb-2">{data.numbering}</div>
          <div className="text-[#1e293b] font-medium mb-6">{data.instructions}</div>
          
          <div className="mb-8">
            <h5 className="text-sm font-bold text-slate-800 mb-4">List of Headings</h5>
            <div className="flex flex-col gap-2">
              {data.headings?.map((h: any, idx: number) => {
                if (usedHeadingIds.includes(idx)) return null;
                return (
                  <div 
                    key={idx} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({
                        type: 'heading',
                        id: idx,
                        text: h.text
                      }));
                    }}
                    className="inline-block px-4 py-2 bg-white border border-slate-300 rounded shadow-sm cursor-move hover:border-[#2563eb] hover:shadow transition-all text-sm text-slate-700 font-medium self-start"
                  >
                    {h.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    case 'map_labeling':
    case 'gap_fill_visual':
      return (
        <div className="space-y-6">
          <div className="text-sm font-bold text-[#2563eb] mb-2">{data.numbering}</div>
          <div className="text-[#1e293b] font-medium mb-6">{data.instructions}</div>
          {data.image?.dataUrl && (
            <div className="relative shadow-xl bg-white shrink-0 rounded-lg overflow-hidden border border-slate-200 mx-auto" style={{ width: 'fit-content' }}>
              <img src={data.image.dataUrl} className="max-w-none block select-none" style={{ maxHeight: '60vh' }} />
              {data.gaps?.map((g: any) => (
                <div 
                  key={g.id}
                  className="absolute border border-slate-800 flex items-center justify-center font-bold bg-white z-10"
                  style={{
                    left: `${g.x * 100}%`, top: `${g.y * 100}%`, width: `${g.w * 100}%`, height: `${g.h * 100}%`,
                    fontSize: `${g.style?.fontSize || 16}px`
                  }}
                >
                  <input type="text" className="w-full h-full bg-transparent text-center outline-none border-none" placeholder={g.n?.toString()} />
                </div>
              ))}
              {data.texts?.map((t: any) => (
                <div 
                  key={t.id}
                  className="absolute flex items-center z-10 p-1"
                  style={{
                    left: `${t.x * 100}%`, top: `${t.y * 100}%`, width: `${t.w * 100}%`, height: `${t.h * 100}%`,
                    fontSize: `${t.fontSize}px`, color: t.color, fontWeight: t.bold ? 'bold' : 'normal',
                    justifyContent: t.align === 'center' ? 'center' : (t.align === 'right' ? 'flex-end' : 'flex-start'),
                    textAlign: t.align as any
                  }}
                >
                  <span className="truncate">{t.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    case 'matching_visual':
      return (
        <div className="space-y-6">
          <div className="text-sm font-bold text-[#2563eb] mb-2">{data.numbering}</div>
          <div className="text-[#1e293b] font-medium mb-6">{data.instructions}</div>
          {data.image?.dataUrl && (
            <div className="flex flex-col items-center gap-8 w-full">
              <div className="relative shadow-xl bg-white shrink-0 rounded-lg overflow-hidden border border-slate-200" style={{ width: 'fit-content' }}>
                <img src={data.image.dataUrl} className="max-w-none block select-none" style={{ maxHeight: '60vh' }} />
                {data.markers?.map((m: any) => (
                  <div 
                    key={m.id}
                    className="absolute border-2 border-slate-800 bg-white/90 flex items-center justify-center font-bold z-10 rounded"
                    style={{
                      left: `${m.x * 100}%`, top: `${m.y * 100}%`, width: `${m.w * 100}%`, height: `${m.h * 100}%`
                    }}
                  >
                    <span className="text-slate-800">{m.label || '?'}</span>
                  </div>
                ))}
              </div>
              {data.items?.length > 0 && (
                <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="space-y-3">
                    {data.items.map((item: any, idx: number) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex gap-3">
                          <span className="font-bold text-[#1e293b]">{idx + 1}.</span>
                          <span className="text-sm text-[#1e293b]">{item.text || '(Empty item)'}</span>
                        </div>
                        <input type="text" className="w-16 h-8 border-2 border-slate-200 rounded-lg bg-white text-center font-bold text-[#2563eb] outline-none focus:border-[#2563eb] transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    case 'matching':
      return (
        <div className="space-y-6">
          <div className="text-sm font-bold text-[#2563eb] mb-2">{data.numbering}</div>
          <div className="text-[#1e293b] font-medium mb-6">{data.instructions}</div>
          {data.prompt && <p className="text-[#1e293b] mb-6 italic">{data.prompt}</p>}
          
          <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">{data.config?.optionColumnTitle || 'Options'}</h5>
            <div className={cn("flex gap-3", data.config?.optionsInColumn ? "flex-col" : "flex-wrap")}>
              {data.options?.map((opt: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <span className="font-bold text-[#2563eb]">{String.fromCharCode(65 + idx)}</span>
                  <span className="text-sm text-slate-700">{opt.text || '(Empty option)'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{data.config?.itemColumnTitle || 'Items'}</h5>
            {data.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="flex gap-3">
                  <span className="font-bold text-[#1e293b]">{idx + 1}.</span>
                  <span className="text-sm text-[#1e293b]">{item.text || '(Empty item)'}</span>
                </div>
                <input type="text" className="w-16 h-8 border-2 border-slate-200 rounded-lg bg-slate-50 text-center font-bold text-[#2563eb] outline-none focus:border-[#2563eb] transition-colors" />
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500">
          Preview for {type} is not fully implemented yet.
        </div>
      );
  }
}

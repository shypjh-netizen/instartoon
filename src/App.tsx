import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  User, 
  BookOpen, 
  Send, 
  RefreshCw, 
  Download, 
  Image as ImageIcon,
  ChevronRight,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { 
  generateCharacter, 
  generateCharacterImage, 
  generateScript, 
  generateBackgroundImage,
  Character, 
  Script 
} from './services/gemini';

interface PanelWithImage extends NonNullable<Script['panels'][number]> {
  backgroundUrl?: string;
  isBgLoading?: boolean;
}

interface ScriptWithImages extends Script {
  panels: PanelWithImage[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'character' | 'script'>('character');
  const [charInput, setCharInput] = useState('');
  const [scriptInput, setScriptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);
  const [script, setScript] = useState<ScriptWithImages | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [panelCount, setPanelCount] = useState(4);

  const handleGenerateCharacter = async () => {
    if (!charInput.trim()) return;
    setIsGenerating(true);
    try {
      const char = await generateCharacter(charInput);
      setCharacter(char);
      setIsImageLoading(true);
      const imageUrl = await generateCharacterImage(char.visualPrompt);
      setCharacter(prev => prev ? { ...prev, imageUrl } : null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
      setIsImageLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!character || !scriptInput.trim()) return;
    setIsGenerating(true);
    try {
      const s = await generateScript(character, scriptInput, panelCount);
      setScript(s as ScriptWithImages);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddPanel = () => {
    if (!script) {
      setScript({
        title: '새로운 이야기',
        panels: [{
          panelNumber: 1,
          visualDescription: '',
          dialogue: '',
          narration: '',
        }]
      });
    } else {
      setScript({
        ...script,
        panels: [
          ...script.panels,
          {
            panelNumber: script.panels.length + 1,
            visualDescription: '',
            dialogue: '',
            narration: '',
          }
        ]
      });
    }
  };

  const handleUpdatePanel = (index: number, field: keyof PanelWithImage, value: string) => {
    if (!script) return;
    const newPanels = [...script.panels];
    (newPanels[index] as any)[field] = value;
    setScript({ ...script, panels: newPanels });
  };

  const handleDeletePanel = (index: number) => {
    if (!script) return;
    const newPanels = script.panels.filter((_, i) => i !== index);
    // Re-number panels
    const renumberedPanels = newPanels.map((p, i) => ({ ...p, panelNumber: i + 1 }));
    setScript({ ...script, panels: renumberedPanels });
  };

  const handleGeneratePanelBackground = async (panelIndex: number) => {
    if (!script) return;
    
    const newPanels = [...script.panels];
    const visualDesc = newPanels[panelIndex].visualDescription;
    
    if (!visualDesc.trim()) {
      alert('배경을 생성하려면 시각적 묘사(Visual Description)를 입력해주세요.');
      return;
    }

    newPanels[panelIndex].isBgLoading = true;
    setScript({ ...script, panels: newPanels });

    try {
      const bgUrl = await generateBackgroundImage(visualDesc, character?.imageUrl);
      newPanels[panelIndex].backgroundUrl = bgUrl;
    } catch (error) {
      console.error(error);
    } finally {
      newPanels[panelIndex].isBgLoading = false;
      setScript({ ...script, panels: newPanels });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-black bg-white p-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-black p-2 rounded-lg">
              <Sparkles className="text-yellow-300 w-6 h-6" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight">INSTATOON AI</h1>
          </div>
          <nav className="flex gap-4">
            <button 
              onClick={() => setActiveTab('character')}
              className={`px-4 py-2 font-display font-bold transition-all ${activeTab === 'character' ? 'bg-black text-white' : 'hover:bg-zinc-100'}`}
            >
              캐릭터 생성
            </button>
            <button 
              onClick={() => setActiveTab('script')}
              disabled={!character}
              className={`px-4 py-2 font-display font-bold transition-all ${!character ? 'opacity-30 cursor-not-allowed' : activeTab === 'script' ? 'bg-black text-white' : 'hover:bg-zinc-100'}`}
            >
              대본 작성
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Inputs */}
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              {activeTab === 'character' ? <User className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
              {activeTab === 'character' ? '어떤 캐릭터를 만들까요?' : '어떤 이야기를 만들까요?'}
            </h2>
            
            <div className="brutalist-card p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-yellow-100 border border-yellow-600 text-yellow-700 text-[10px] font-bold rounded uppercase">초심플 그림체 활성화</span>
              </div>
              {activeTab === 'character' ? (
                <>
                  <textarea 
                    value={charInput}
                    onChange={(e) => setCharInput(e.target.value)}
                    placeholder="예: 카페 아르바이트를 하는 소심하지만 상상력이 풍부한 햄스터 캐릭터"
                    className="w-full h-32 p-4 border-2 border-black focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none font-sans"
                  />
                  <button 
                    onClick={handleGenerateCharacter}
                    disabled={isGenerating || !charInput.trim()}
                    className="brutalist-button w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    캐릭터 탄생시키기
                  </button>
                </>
              ) : (
                <>
                  <div className="p-4 bg-zinc-100 border-2 border-black mb-4 flex items-center gap-4">
                    {character?.imageUrl ? (
                      <img src={character.imageUrl} alt={character.name} className="w-12 h-12 rounded-full border border-black bg-white" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-300 border border-black flex items-center justify-center">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className="font-display font-bold">{character?.name}</p>
                      <p className="text-xs text-zinc-500">선택된 캐릭터</p>
                    </div>
                  </div>
                  <textarea 
                    value={scriptInput}
                    onChange={(e) => setScriptInput(e.target.value)}
                    placeholder="예: 손님이 한 명도 안 오는 날, 혼자만의 파티를 여는 에피소드"
                    className="w-full h-32 p-4 border-2 border-black focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none font-sans"
                  />
                  
                  <div className="space-y-2 py-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">컷 수 설정 ({panelCount}컷)</label>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={panelCount} 
                      onChange={(e) => setPanelCount(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                    <div className="flex justify-between text-[9px] font-bold text-zinc-400">
                      <span>1컷</span>
                      <span>4컷</span>
                      <span>10컷</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={handleGenerateScript}
                      disabled={isGenerating || !scriptInput.trim()}
                      className="brutalist-button flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      AI 대본 생성
                    </button>
                    <button 
                      onClick={() => {
                        setScript({
                          title: '새로운 이야기',
                          panels: Array.from({ length: panelCount }, (_, i) => ({
                            panelNumber: i + 1,
                            visualDescription: '',
                            dialogue: '',
                            narration: '',
                          }))
                        });
                      }}
                      className="brutalist-button bg-white flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      직접 작성하기
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>

          {character && activeTab === 'character' && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-display font-bold">캐릭터 프로필</h2>
              <div className="brutalist-card p-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {character.traits.map((trait, i) => (
                    <span key={i} className="px-3 py-1 bg-zinc-100 border border-black text-sm font-medium">
                      #{trait}
                    </span>
                  ))}
                </div>
                <p className="leading-relaxed">{character.description}</p>
                <button 
                  onClick={() => setActiveTab('script')}
                  className="flex items-center gap-2 text-sm font-bold hover:underline"
                >
                  이 캐릭터로 대본 쓰러 가기 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.section>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="space-y-8">
          <section className="h-full flex flex-col">
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              미리보기
            </h2>
            
            <div className="brutalist-card flex-1 p-6 bg-zinc-100 min-h-[400px] flex flex-col">
              <AnimatePresence mode="wait">
                {activeTab === 'character' ? (
                  character ? (
                    <motion.div 
                      key="char-preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center space-y-6"
                    >
                      <div className="relative group">
                        <div className="absolute -inset-2 bg-yellow-300 border-2 border-black -z-10 rotate-3 transition-transform group-hover:rotate-6" />
                        {isImageLoading ? (
                          <div className="w-64 h-64 bg-white border-2 border-black flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 animate-spin text-zinc-400" />
                          </div>
                        ) : character.imageUrl ? (
                          <img 
                            src={character.imageUrl} 
                            alt={character.name} 
                            className="w-64 h-64 object-contain bg-white border-2 border-black"
                          />
                        ) : (
                          <div className="w-64 h-64 bg-white border-2 border-black flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-zinc-300" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-3xl font-display font-bold">{character.name}</h3>
                    </motion.div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-4">
                      <User className="w-16 h-16" />
                      <p className="font-display">캐릭터를 생성하면 여기에 나타납니다</p>
                    </div>
                  )
                ) : (
                  script ? (
                    <motion.div 
                      key="script-preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 space-y-6 overflow-y-auto max-h-[600px] pr-2"
                    >
                      <div className="border-b-2 border-black pb-4 flex justify-between items-center">
                        <h3 className="text-2xl font-display font-bold">{script.title}</h3>
                        <button 
                          onClick={() => {
                            const text = script.panels.map(p => `[Panel ${p.panelNumber}]\nVisual: ${p.visualDescription}\nDialogue: ${p.dialogue}\nNarration: ${p.narration}\n`).join('\n');
                            const blob = new Blob([text], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${script.title}.txt`;
                            a.click();
                          }}
                          className="text-xs font-bold flex items-center gap-1 hover:underline"
                        >
                          <Download className="w-3 h-3" />
                          TXT 다운로드
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                        {script.panels.map((panel, idx) => (
                          <div key={panel.panelNumber} className="bg-white border-2 border-black p-4 space-y-3">
                            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-display font-bold bg-black text-white px-2 py-0.5 text-xs">장면 {panel.panelNumber}</span>
                                <button 
                                  onClick={() => handleDeletePanel(idx)}
                                  className="text-zinc-400 hover:text-red-500 transition-colors"
                                  title="패널 삭제"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <button 
                                onClick={() => handleGeneratePanelBackground(idx)}
                                disabled={panel.isBgLoading}
                                className="text-[10px] font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
                              >
                                {panel.isBgLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                                {panel.backgroundUrl ? '배경 다시 생성' : '배경 생성'}
                              </button>
                            </div>
                            
                            {panel.backgroundUrl ? (
                              <div className="relative aspect-video border border-zinc-200 overflow-hidden bg-white">
                                <img src={panel.backgroundUrl} alt={`장면 ${panel.panelNumber} 배경`} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              character?.imageUrl && (
                                <div className="relative aspect-video border border-zinc-200 overflow-hidden bg-zinc-50 flex items-center justify-center">
                                  <img 
                                    src={character.imageUrl} 
                                    alt="캐릭터 미리보기" 
                                    className="w-32 h-32 object-contain opacity-30"
                                  />
                                  <p className="absolute bottom-2 text-[10px] text-zinc-400 font-bold">배경을 생성하면 캐릭터가 배경 속으로 들어갑니다</p>
                                </div>
                              )
                            )}

                            <div className="space-y-2">
                              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">장면 묘사 (배경 생성용)</p>
                              <textarea 
                                value={panel.visualDescription}
                                onChange={(e) => handleUpdatePanel(idx, 'visualDescription', e.target.value)}
                                placeholder="배경에 대한 설명을 적어주세요..."
                                className="w-full p-2 text-sm border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-yellow-300 resize-none italic text-zinc-600"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">대사</p>
                              <input 
                                type="text"
                                value={panel.dialogue}
                                onChange={(e) => handleUpdatePanel(idx, 'dialogue', e.target.value)}
                                placeholder="캐릭터의 대사를 입력하세요..."
                                className="w-full p-2 text-sm border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-yellow-300 font-bold"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">나레이션</p>
                              <input 
                                type="text"
                                value={panel.narration}
                                onChange={(e) => handleUpdatePanel(idx, 'narration', e.target.value)}
                                placeholder="나레이션을 입력하세요..."
                                className="w-full p-2 text-sm border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-yellow-300 font-medium"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-4">
                      <BookOpen className="w-16 h-16" />
                      <p className="font-display">대본을 생성하면 여기에 나타납니다</p>
                    </div>
                  )
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t-2 border-black p-6 bg-white text-center">
        <p className="text-sm text-zinc-500 font-display">© 2026 INSTATOON AI. Powered by Gemini.</p>
      </footer>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { 
  HelpCircle, Settings, Undo, Redo, Eraser, Play, AlertTriangle, 
  Bold, Italic, Underline, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, 
  Indent, Outdent, Superscript, Subscript
} from 'lucide-react';
import { cleanHtml } from './services/cleanerService';
import { LegacyCodeViewer, LegacyVisualPreview } from './components/LegacyOutput';
import { HelpModal } from './components/HelpModal';
import { SettingsModal } from './components/SettingsModal';
import { ConversionConfig } from './types';

const App: React.FC = () => {
  // Configuration State
  const [config, setConfig] = useState<ConversionConfig>({
    useParagraphs: true,
    convertDivsToP: true,
    cleanAttributes: true,
    aggressiveWhitespace: true,
  });

  const [outputHtml, setOutputHtml] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Editor & History State
  const editorRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [inputStats, setInputStats] = useState({ words: 0, chars: 0 });
  
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- History Management ---

  const addToHistory = (newContent: string) => {
    setHistory((prev) => {
      const currentContent = prev[historyIndex];
      // Avoid duplicate states
      if (currentContent === newContent) return prev;

      // Slice history if we are in the middle of the stack
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, newContent];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const calculateInputStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;
    setInputStats({ words, chars });
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;

    calculateInputStats();

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      addToHistory(content);
    }, 750);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousContent = history[newIndex];
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = previousContent;
        calculateInputStats();
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextContent = history[newIndex];
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = nextContent;
        calculateInputStats();
      }
    }
  };

  const handleClear = () => {
    if (!editorRef.current) return;
    
    const currentContent = editorRef.current.innerHTML;
    if (currentContent !== history[historyIndex]) {
       addToHistory(currentContent);
       setTimeout(() => {
         addToHistory('');
         setHistoryIndex(prev => prev + 1); 
       }, 0);
    } else {
       addToHistory('');
    }

    editorRef.current.innerHTML = '';
    calculateInputStats();
    setOutputHtml('');
    setErrorMsg(null);
  };

  // --- Editor Formatting ---
  const execCmd = (command: string, value?: string) => {
    // Ensure the editor has focus before executing command
    if (editorRef.current && document.activeElement !== editorRef.current) {
       editorRef.current.focus();
    }
    
    document.execCommand(command, false, value);
    
    if (editorRef.current) {
      handleInput(); // Trigger history save & stats update
    }
  };

  // --- Conversion Logic ---

  const handleConvert = () => {
    if (!editorRef.current) return;

    setErrorMsg(null);
    const rawInput = editorRef.current.innerHTML;
    
    if (!rawInput.trim()) {
      return;
    }

    const result = cleanHtml(rawInput, config);
    
    if (result.error) {
      setErrorMsg(result.error);
      setOutputHtml('');
    } else {
      setOutputHtml(result.html);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Allow the paste to happen, then calculate stats
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    setTimeout(() => {
       if (editorRef.current) {
         addToHistory(editorRef.current.innerHTML);
         calculateInputStats();
       }
    }, 100);
  };

  // --- Toolbar Component Helper ---
  const ToolbarButton = ({ 
    icon: Icon, 
    onClick, 
    title, 
    disabled = false 
  }: { icon: React.ElementType, onClick: () => void, title: string, disabled?: boolean }) => (
    <button 
      onMouseDown={(e) => e.preventDefault()} 
      onClick={onClick} 
      disabled={disabled}
      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-transparent" 
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  const Divider = () => <div className="w-px h-4 bg-slate-300 mx-1" />;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={config} 
        onConfigChange={setConfig} 
      />

      {/* Top Bar */}
      <header className="bg-slate-900 text-white shadow-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-24 flex items-center justify-between relative">
          
          <div className="flex flex-col z-20">
             <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">Hello World</h1>
             <span className="text-xs text-indigo-300 font-medium tracking-wide">Legacy RTF Converter</span>
          </div>

          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <img 
              src="https://res.cloudinary.com/dbylka4xx/image/upload/v1765443879/Ai_For_Pinoys_Final_Logo_ol3zyu.png" 
              alt="Ai For Pinoys" 
              className="h-20 sm:h-[100px] w-auto object-contain hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-4 z-20">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Guide</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-800">Conversion Failed</h3>
              <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400 hover:text-red-600">
              <span className="sr-only">Dismiss</span>
              <Eraser className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2-COLUMN LAYOUT: INPUT & OUTPUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
          
          {/* COLUMN 1: INPUT + EDITOR + CONVERT ACTION */}
          <div className="flex flex-col h-full bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
             
             {/* Editor Header: Title & Clear */}
             <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between flex-shrink-0">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Step 1: Editor / Paste</span>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {inputStats.words} words | {inputStats.chars} chars
                  </div>
                </div>
                <button onClick={handleClear} className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Clear All">
                    <Eraser className="w-4 h-4" />
                </button>
             </div>
             
             {/* Editor Toolbar */}
             <div className="bg-slate-50 border-b border-slate-200 px-2 py-2 flex items-center flex-wrap gap-y-2 flex-shrink-0">
                
                {/* History */}
                <div className="flex items-center">
                  <ToolbarButton icon={Undo} onClick={handleUndo} title="Undo (Ctrl+Z)" disabled={historyIndex === 0} />
                  <ToolbarButton icon={Redo} onClick={handleRedo} title="Redo (Ctrl+Y)" disabled={historyIndex >= history.length - 1} />
                </div>
                
                <Divider />

                {/* Character Formatting */}
                <div className="flex items-center">
                  <ToolbarButton icon={Bold} onClick={() => execCmd('bold')} title="Bold (Ctrl+B)" />
                  <ToolbarButton icon={Italic} onClick={() => execCmd('italic')} title="Italic (Ctrl+I)" />
                  <ToolbarButton icon={Underline} onClick={() => execCmd('underline')} title="Underline (Ctrl+U)" />
                  <ToolbarButton icon={Subscript} onClick={() => execCmd('subscript')} title="Subscript" />
                  <ToolbarButton icon={Superscript} onClick={() => execCmd('superscript')} title="Superscript" />
                </div>

                <Divider />

                {/* Alignment */}
                <div className="flex items-center">
                  <ToolbarButton icon={AlignLeft} onClick={() => execCmd('justifyLeft')} title="Align Left" />
                  <ToolbarButton icon={AlignCenter} onClick={() => execCmd('justifyCenter')} title="Center" />
                  <ToolbarButton icon={AlignRight} onClick={() => execCmd('justifyRight')} title="Align Right" />
                </div>

                <Divider />

                {/* Lists & Indentation */}
                <div className="flex items-center">
                  <ToolbarButton icon={List} onClick={() => execCmd('insertUnorderedList')} title="Bullet List" />
                  <ToolbarButton icon={ListOrdered} onClick={() => execCmd('insertOrderedList')} title="Numbered List" />
                  <ToolbarButton icon={Indent} onClick={() => execCmd('indent')} title="Increase Indent" />
                  <ToolbarButton icon={Outdent} onClick={() => execCmd('outdent')} title="Decrease Indent" />
                </div>

             </div>
             
             <div className="flex-1 relative overflow-hidden">
                <div 
                  ref={editorRef}
                  contentEditable
                  onInput={handleInput}
                  onPaste={handlePaste}
                  className="w-full h-full p-4 outline-none overflow-y-auto text-slate-800 focus:bg-indigo-50/10 transition-colors 
                             [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 
                             [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic 
                             [&_u]:underline 
                             [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold
                             [&_sub]:align-sub [&_sub]:text-xs [&_sup]:align-super [&_sup]:text-xs"
                  data-placeholder="Type here or paste text from Word/Outlook..."
                />
             </div>

             {/* Footer with Convert Button */}
             <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end flex-shrink-0">
                <button
                  onClick={handleConvert}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all transform active:scale-95 hover:shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Convert to HTML
                </button>
             </div>
          </div>

          {/* COLUMN 2: OUTPUT CODE */}
          <div className="h-full">
            <LegacyCodeViewer html={outputHtml} />
          </div>

        </div>

        {/* ROW 2: VISUAL PREVIEW (Expanded) */}
        <div className="min-h-[500px] flex-1">
            <LegacyVisualPreview html={outputHtml} />
        </div>

      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            Created by{' '}
            <a 
              href="https://aiforpinoys.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              aiforpinoys
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
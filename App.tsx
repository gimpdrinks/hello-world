import React, { useState } from 'react';
import { 
  HelpCircle, Settings, Undo, Redo, Eraser, Play, AlertTriangle, 
  Bold, Italic, Underline, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, 
  Indent, Outdent, Superscript, Subscript,
  Loader2
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import SubscriptExtension from '@tiptap/extension-subscript';
import SuperscriptExtension from '@tiptap/extension-superscript';

import { cleanHtml } from './services/cleanerService';
import { cleanWithGemini } from './services/geminiService';
import { LegacyCodeViewer, LegacyVisualPreview } from './components/LegacyOutput';
import { HelpModal } from './components/HelpModal';
import { SettingsModal } from './components/SettingsModal';
import { ConversionConfig } from './types';

const App: React.FC = () => {
  // Configuration State
  const [config, setConfig] = useState<ConversionConfig>({
    mode: 'standard',
    useParagraphs: true,
    convertDivsToP: true,
    cleanAttributes: true,
    aggressiveWhitespace: true,
  });

  const [outputHtml, setOutputHtml] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputStats, setInputStats] = useState({ words: 0, chars: 0 });

  // --- Tiptap Editor Setup ---
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      SubscriptExtension,
      SuperscriptExtension,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'w-full h-full p-4 outline-none overflow-y-auto text-slate-800 focus:bg-indigo-50/10 transition-colors prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1',
        'data-placeholder': 'Type here or paste text from Word/Outlook...',
        'aria-label': 'Rich Text Editor Input',
        'aria-multiline': 'true',
        role: 'textbox',
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      const chars = text.length;
      setInputStats({ words, chars });
    },
  });

  const handleClear = () => {
    if (!editor) return;
    editor.commands.setContent('');
    setInputStats({ words: 0, chars: 0 });
    setOutputHtml('');
    setErrorMsg(null);
  };

  // --- Conversion Logic ---
  const handleConvert = async () => {
    if (!editor) return;

    setErrorMsg(null);
    // Use getHTML() to retrieve the HTML content from Tiptap
    const rawInput = editor.getHTML();
    
    // Basic empty check (Tiptap usually returns <p></p> for empty)
    if (!editor.getText().trim()) {
      return;
    }

    if (config.mode === 'ai') {
      setIsLoading(true);
      try {
        const resultHtml = await cleanWithGemini(rawInput, config);
        setOutputHtml(resultHtml);
      } catch (e) {
        console.error(e);
        setErrorMsg("AI Conversion failed. Ensure API key is set or try Standard mode.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Standard Logic
      const result = cleanHtml(rawInput, config);
      
      if (result.error) {
        setErrorMsg(result.error);
        setOutputHtml('');
      } else {
        setOutputHtml(result.html);
      }
    }
  };

  // --- Toolbar Component Helper ---
  const ToolbarButton = ({ 
    icon: Icon, 
    onClick, 
    title, 
    disabled = false,
    isActive = false
  }: { 
    icon: React.ElementType, 
    onClick: () => void, 
    title: string, 
    disabled?: boolean,
    isActive?: boolean
  }) => (
    <button 
      onMouseDown={(e) => e.preventDefault()} 
      onClick={onClick} 
      disabled={disabled}
      aria-label={title}
      aria-pressed={isActive}
      className={`p-1.5 border rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed 
        ${isActive 
          ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-inner' 
          : 'text-slate-600 hover:text-indigo-600 hover:bg-white border-transparent hover:border-slate-200 hover:shadow-sm'
        }`}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  const Divider = () => <div className="w-px h-4 bg-slate-300 mx-1" />;

  if (!editor) {
    return null;
  }

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
             <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">Legacy Converter</h1>
             <span className="text-xs text-indigo-300 font-medium tracking-wide">Clean RTF to HTML Tool</span>
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
              aria-label="Open Settings"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button 
              onClick={() => setIsHelpOpen(true)}
              aria-label="Open User Guide"
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
            <button 
              onClick={() => setErrorMsg(null)} 
              aria-label="Dismiss Error"
              className="ml-auto text-red-400 hover:text-red-600"
            >
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
                <button 
                  onClick={handleClear} 
                  aria-label="Clear Editor Content"
                  className="text-slate-400 hover:text-red-600 transition-colors p-1" 
                  title="Clear All"
                >
                    <Eraser className="w-4 h-4" />
                </button>
             </div>
             
             {/* Editor Toolbar */}
             <div className="bg-slate-50 border-b border-slate-200 px-2 py-2 flex items-center flex-wrap gap-y-2 flex-shrink-0">
                
                {/* History (Built-in Tiptap) */}
                <div className="flex items-center">
                  <ToolbarButton 
                    icon={Undo} 
                    onClick={() => editor.chain().focus().undo().run()} 
                    title="Undo (Ctrl+Z)" 
                    disabled={!editor.can().undo()} 
                  />
                  <ToolbarButton 
                    icon={Redo} 
                    onClick={() => editor.chain().focus().redo().run()} 
                    title="Redo (Ctrl+Y)" 
                    disabled={!editor.can().redo()} 
                  />
                </div>
                
                <Divider />

                {/* Character Formatting */}
                <div className="flex items-center">
                  <ToolbarButton 
                    icon={Bold} 
                    onClick={() => editor.chain().focus().toggleBold().run()} 
                    title="Bold (Ctrl+B)" 
                    isActive={editor.isActive('bold')} 
                  />
                  <ToolbarButton 
                    icon={Italic} 
                    onClick={() => editor.chain().focus().toggleItalic().run()} 
                    title="Italic (Ctrl+I)" 
                    isActive={editor.isActive('italic')} 
                  />
                  <ToolbarButton 
                    icon={Underline} 
                    onClick={() => editor.chain().focus().toggleUnderline().run()} 
                    title="Underline (Ctrl+U)" 
                    isActive={editor.isActive('underline')} 
                  />
                  <ToolbarButton 
                    icon={Subscript} 
                    onClick={() => editor.chain().focus().toggleSubscript().run()} 
                    title="Subscript" 
                    isActive={editor.isActive('subscript')} 
                  />
                  <ToolbarButton 
                    icon={Superscript} 
                    onClick={() => editor.chain().focus().toggleSuperscript().run()} 
                    title="Superscript" 
                    isActive={editor.isActive('superscript')} 
                  />
                </div>

                <Divider />

                {/* Alignment */}
                <div className="flex items-center">
                  <ToolbarButton 
                    icon={AlignLeft} 
                    onClick={() => editor.chain().focus().setTextAlign('left').run()} 
                    title="Align Left" 
                    isActive={editor.isActive({ textAlign: 'left' })} 
                  />
                  <ToolbarButton 
                    icon={AlignCenter} 
                    onClick={() => editor.chain().focus().setTextAlign('center').run()} 
                    title="Center" 
                    isActive={editor.isActive({ textAlign: 'center' })} 
                  />
                  <ToolbarButton 
                    icon={AlignRight} 
                    onClick={() => editor.chain().focus().setTextAlign('right').run()} 
                    title="Align Right" 
                    isActive={editor.isActive({ textAlign: 'right' })} 
                  />
                </div>

                <Divider />

                {/* Lists & Indentation */}
                <div className="flex items-center">
                  <ToolbarButton 
                    icon={List} 
                    onClick={() => editor.chain().focus().toggleBulletList().run()} 
                    title="Bullet List" 
                    isActive={editor.isActive('bulletList')} 
                  />
                  <ToolbarButton 
                    icon={ListOrdered} 
                    onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                    title="Numbered List" 
                    isActive={editor.isActive('orderedList')} 
                  />
                  <ToolbarButton 
                    icon={Indent} 
                    onClick={() => editor.chain().focus().sinkListItem('listItem').run()} 
                    title="Increase Indent (Lists)" 
                    disabled={!editor.can().sinkListItem('listItem')} 
                  />
                  <ToolbarButton 
                    icon={Outdent} 
                    onClick={() => editor.chain().focus().liftListItem('listItem').run()} 
                    title="Decrease Indent (Lists)" 
                    disabled={!editor.can().liftListItem('listItem')} 
                  />
                </div>

             </div>
             
             <div className="flex-1 relative overflow-hidden bg-white">
                <EditorContent editor={editor} className="h-full" />
             </div>

             {/* Footer with Convert Button */}
             <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end flex-shrink-0">
                <button
                  onClick={handleConvert}
                  disabled={isLoading}
                  aria-label={isLoading ? "Converting content..." : "Convert content to HTML"}
                  className={`flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all transform active:scale-95 hover:shadow-lg ${
                    isLoading ? 'opacity-70 cursor-wait' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Converting...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Convert to HTML</span>
                    </>
                  )}
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
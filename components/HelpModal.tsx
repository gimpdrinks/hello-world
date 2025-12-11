import React from 'react';
import { X, FileDown, Play, ShieldCheck, Monitor } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">User Guide: Legacy System Converter</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Section 1: Installation */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-600">
              <FileDown className="w-5 h-5" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">Installation / Setup</h3>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm text-slate-700">
              <p className="font-medium mb-2">How to save this tool to your Desktop:</p>
              <ol className="list-decimal list-inside space-y-1 ml-1">
                <li>Right-click anywhere on this page (if opened as a file).</li>
                <li>Select <strong>"Save As..."</strong> or press <strong>Ctrl + S</strong>.</li>
                <li>Choose <strong>"Desktop"</strong> as the location.</li>
                <li>Name it <strong>LegacyConverter.html</strong> and click Save.</li>
                <li>You can now double-click this icon on your desktop anytime to open the tool.</li>
              </ol>
            </div>
          </section>

          {/* Section 2: Workflow */}
          <section className="space-y-3">
             <div className="flex items-center gap-2 text-indigo-600">
              <Play className="w-5 h-5" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">Standard Workflow</h3>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">1</div>
                <div>
                  <p className="font-medium text-slate-900">Open the Tool</p>
                  <p className="text-sm text-slate-500">Double-click the file on your desktop or open the bookmark.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">2</div>
                <div>
                  <p className="font-medium text-slate-900">Paste Content</p>
                  <p className="text-sm text-slate-500">Copy text from Word, Outlook, or a PDF. Paste it into the <strong>Left Box</strong> (Step 1).</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-600">3</div>
                <div>
                  <p className="font-medium text-slate-900">Convert & Copy</p>
                  <p className="text-sm text-slate-500">Click the large <strong>Green Arrow Button</strong> in the center. The screen will flash "Copied!".</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">4</div>
                <div>
                  <p className="font-medium text-slate-900">Paste into Legacy System</p>
                  <p className="text-sm text-slate-500">Switch to your legacy application window. Click the destination field and press <strong>Ctrl + V</strong>.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Why it works */}
          <section className="border-t border-slate-100 pt-6">
             <h3 className="font-semibold text-sm text-slate-800 mb-3">Why use this tool?</h3>
             <div className="grid md:grid-cols-2 gap-4">
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <div className="flex items-center gap-2 mb-2 text-slate-700 font-medium text-sm">
                   <ShieldCheck className="w-4 h-4 text-green-500" />
                   Legacy-Safe Formatting
                 </div>
                 <p className="text-xs text-slate-500 leading-relaxed">
                   Modern Word documents use complex code that breaks old systems. This tool strips all that "junk" code and uses only simple tags like <strong>&lt;b&gt;</strong> and <strong>&lt;p&gt;</strong> that our system understands.
                 </p>
               </div>
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <div className="flex items-center gap-2 mb-2 text-slate-700 font-medium text-sm">
                   <Monitor className="w-4 h-4 text-blue-500" />
                   Clean Fragments
                 </div>
                 <p className="text-xs text-slate-500 leading-relaxed">
                   We ensure no <strong>&lt;html&gt;</strong> or <strong>&lt;body&gt;</strong> tags are included, preventing database errors when pasting into existing fields.
                 </p>
               </div>
             </div>
          </section>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-right">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded hover:bg-slate-800 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

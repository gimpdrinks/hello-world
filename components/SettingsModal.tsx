import React from 'react';
import { X, Settings, AlignLeft, Scissors, Cpu, Zap } from 'lucide-react';
import { ConversionConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConversionConfig;
  onConfigChange: (newConfig: ConversionConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onConfigChange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-800">Conversion Settings</h2>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close Settings"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Engine Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <h3>Processing Engine</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <button
                 onClick={() => onConfigChange({ ...config, mode: 'standard' })}
                 aria-pressed={config.mode === 'standard'}
                 className={`p-3 rounded-lg border text-sm text-left transition-all ${
                   config.mode === 'standard'
                     ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500' 
                     : 'border-slate-200 hover:border-slate-300 text-slate-600'
                 }`}
               >
                 <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3 h-3" />
                    <span className="font-semibold text-xs uppercase">Standard</span>
                 </div>
                 <div className="font-medium text-xs opacity-75">Fast, rule-based cleanup. Good for simple text.</div>
               </button>
               <button
                 onClick={() => onConfigChange({ ...config, mode: 'ai' })}
                 aria-pressed={config.mode === 'ai'}
                 className={`p-3 rounded-lg border text-sm text-left transition-all ${
                   config.mode === 'ai'
                     ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500' 
                     : 'border-slate-200 hover:border-slate-300 text-slate-600'
                 }`}
               >
                 <div className="flex items-center gap-2 mb-1">
                    <Cpu className="w-3 h-3" />
                    <span className="font-semibold text-xs uppercase">Gemini AI</span>
                 </div>
                 <div className="font-medium text-xs opacity-75">Smart, context-aware. Fixes complex formatting errors.</div>
               </button>
            </div>
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          {/* Paragraph Style Configuration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <AlignLeft className="w-4 h-4 text-indigo-500" />
              <h3>Paragraph Formatting</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <button
                 onClick={() => onConfigChange({ ...config, useParagraphs: true })}
                 aria-pressed={config.useParagraphs}
                 className={`p-3 rounded-lg border text-sm text-left transition-all ${
                   config.useParagraphs 
                     ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500' 
                     : 'border-slate-200 hover:border-slate-300 text-slate-600'
                 }`}
               >
                 <div className="font-mono text-xs mb-1 opacity-75">&lt;p&gt;Text&lt;/p&gt;</div>
                 <div className="font-medium">Use Paragraph Tags</div>
               </button>
               <button
                 onClick={() => onConfigChange({ ...config, useParagraphs: false })}
                 aria-pressed={!config.useParagraphs}
                 className={`p-3 rounded-lg border text-sm text-left transition-all ${
                   !config.useParagraphs 
                     ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500' 
                     : 'border-slate-200 hover:border-slate-300 text-slate-600'
                 }`}
               >
                 <div className="font-mono text-xs mb-1 opacity-75">Text&lt;br&gt;&lt;br&gt;</div>
                 <div className="font-medium">Use Line Breaks</div>
               </button>
            </div>
            <p className="text-xs text-slate-500">
              Select "Use Line Breaks" if your legacy system creates large gaps with standard paragraph tags.
            </p>
          </div>

          {/* Whitespace Cleaning Configuration */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
             <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Scissors className="w-4 h-4 text-indigo-500" />
              <h3>Cleanup Level</h3>
            </div>
            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input 
                type="checkbox"
                checked={config.aggressiveWhitespace}
                onChange={(e) => onConfigChange({ ...config, aggressiveWhitespace: e.target.checked })}
                className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <div>
                <span className="block text-sm font-medium text-slate-700">Aggressive Whitespace Removal</span>
                <span className="block text-xs text-slate-500 mt-0.5">Collapses multiple spaces into one and removes extra tabs/newlines. Uncheck if you need to preserve specific spacing from Word.</span>
              </div>
            </label>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-right">
          <button 
            onClick={onClose} 
            aria-label="Close Settings"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
import React, { useState, useMemo } from 'react';
import { Eye, Code, Copy, Check } from 'lucide-react';
import DOMPurify from 'dompurify';

interface LegacyProps {
  html: string;
}

const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
};

export const LegacyCodeViewer: React.FC<LegacyProps> = ({ html }) => {
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    if (!html) return { words: 0, chars: 0 };
    return {
        chars: html.length,
        words: getWordCount(html)
    };
  }, [html]);

  const handleCopy = () => {
    if (!html) return;
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Step 2: Copy This Code</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5 ml-6">
             {stats.words} words | {stats.chars} chars
          </div>
        </div>
        <button
          onClick={handleCopy}
          disabled={!html}
          aria-label={copied ? "Content copied to clipboard" : "Copy HTML code to clipboard"}
          className={`
            flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all duration-200 shadow-sm
            ${copied 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-white border border-slate-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300'}
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400
          `}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'COPY THIS CODE'}
        </button>
      </div>
      <textarea 
        readOnly
        value={html}
        placeholder="Clean HTML code will appear here..."
        className="flex-1 w-full p-4 font-mono text-sm text-slate-700 resize-none focus:outline-none bg-slate-50"
      />
    </div>
  );
};

export const LegacyVisualPreview: React.FC<LegacyProps> = ({ html }) => {
  const sanitizedHtml = useMemo(() => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li', 'sub', 'sup', 'span'],
      ALLOWED_ATTR: [] // Legacy systems usually don't support attributes
    });
  }, [html]);

  const stats = useMemo(() => {
      if (!sanitizedHtml) return { words: 0, chars: 0 };
      const temp = document.createElement('div');
      temp.innerHTML = sanitizedHtml;
      const txt = temp.textContent || "";
      return {
          words: getWordCount(txt),
          chars: txt.length
      };
  }, [sanitizedHtml]);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
        <Eye className="w-4 h-4 text-slate-500" />
        <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Visual Preview</span>
            <span className="text-[10px] text-slate-400 font-mono">
                {stats.words} words | {stats.chars} chars
            </span>
        </div>
        <span className="text-[10px] text-slate-400 ml-auto self-start mt-0.5">How it looks in legacy system</span>
      </div>
      <div className="flex-1 p-8 overflow-y-auto bg-white min-h-[400px]">
        {sanitizedHtml ? (
          <div 
            className="prose prose-sm max-w-none text-black [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
            style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', lineHeight: '1.5' }} 
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
             <Eye className="w-12 h-12 mb-3 opacity-20" />
             <p className="text-sm italic">Visual preview will appear here after conversion</p>
          </div>
        )}
      </div>
    </div>
  );
};
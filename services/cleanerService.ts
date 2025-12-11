import { ConversionConfig, ProcessingStats } from '../types';
import DOMPurify from 'dompurify';

/**
 * STRICT LEGACY CLEANER (Style-Aware & Structure-Preserving)
 * 
 * Improvements:
 * - Uses DOMPurify to sanitize input.
 * - Relies on DOM manipulation for cleanup instead of fragile Regex.
 * - Handles nested blocks and empty tags robustly.
 */

// Tags to ignore completely
const IGNORE_TAGS = new Set([
  'script', 'style', 'svg', 'xml', 'head', 'meta', 'link', 'object', 'iframe', 'template', 'noscript', 'button', 'input', 'select', 'textarea'
]);

// Tags that represent blocks
const BLOCK_TAGS = new Set([
  'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'article', 'section', 'nav', 'aside', 'header', 'footer', 'blockquote', 'pre', 'figure', 'li', 'tr', 'ul', 'ol', 'table'
]);

// Mapping legacy requirements
const BASE_TAG_MAP: Record<string, string> = {
  'strong': 'b', 'b': 'b',
  'em': 'i', 'i': 'i', 'cite': 'i', 'var': 'i',
  'u': 'u', 'ins': 'u',
  'sub': 'sub', 'sup': 'sup',
  'br': 'br', 'hr': 'br',
  'p': 'p', 'div': 'p', 'blockquote': 'p', 'pre': 'p', 'address': 'p', 'center': 'p',
  'h1': 'p', 'h2': 'p', 'h3': 'p', 'h4': 'p', 'h5': 'p', 'h6': 'p',
  'article': 'p', 'section': 'p', 'main': 'p', 'nav': 'p', 'aside': 'p', 'header': 'p', 'footer': 'p',
  'ul': 'ul', 'ol': 'ol', 'li': 'li', // Preserve lists if structure permits
  'dl': 'p', 'dd': 'br', 'dt': 'b',
  'table': 'p', 'tr': 'br', 'td': 'span', 'th': 'b'
};

const isBoldStyle = (style: string) => /font-weight\s*:\s*(bold|700|800|900)/i.test(style);
const isItalicStyle = (style: string) => /font-style\s*:\s*italic/i.test(style);
const isUnderlineStyle = (style: string) => /text-decoration\s*:\s*underline/i.test(style);

interface ConversionContext {
  insideListListItem?: boolean;
}

export const cleanHtml = (
  rawHtml: string, 
  config: ConversionConfig
): { html: string; stats: ProcessingStats; error?: string } => {
  try {
    // 1. Sanitize Input
    const cleanInput = DOMPurify.sanitize(rawHtml, {
      FORBID_TAGS: ['style', 'script'],
      FORBID_ATTR: ['onmouseover', 'onclick', 'onerror']
    });

    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanInput, 'text/html');
    
    if (doc.querySelector('parsererror')) {
      throw new Error('Malformed HTML structure detected.');
    }

    let tagsRemoved = 0;
    let attributesRemoved = 0;

    // --- DOM WALKER ---
    const processNode = (node: Node, context: ConversionContext = {}): Node | null => {
      // 1. Text Nodes
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent || '';
        // Simplify whitespace
        text = text.replace(/[\n\r]+/g, ' ');
        if (config.aggressiveWhitespace) {
          text = text.replace(/\s+/g, ' ');
        }
        if (!text) return null;
        return document.createTextNode(text);
      }

      // 2. Element Nodes
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        if (IGNORE_TAGS.has(tagName)) {
          tagsRemoved++;
          return null;
        }

        // Detect visual styles
        const styleAttr = el.getAttribute('style') || '';
        if (styleAttr) attributesRemoved++; // Counting style as attribute removal for stats
        
        const hasBold = isBoldStyle(styleAttr);
        const hasItalic = isItalicStyle(styleAttr);
        const hasUnderline = isUnderlineStyle(styleAttr);
        const isHeader = /^h[1-6]$/.test(tagName);

        let targetTag = BASE_TAG_MAP[tagName];

        // Process Children
        const fragment = document.createDocumentFragment();
        
        // Handle List Item numbering simulation for non-native lists (if we decided to flatten lists)
        // But since we support <ul>/<ol>/<li> in legacy, we preserve them unless config changes (future proof).
        // Current requirement: <ul> <ol> <li> are allowed.
        
        const childContext: ConversionContext = {
          insideListListItem: tagName === 'li' || context.insideListListItem
        };

        Array.from(el.childNodes).forEach(child => {
          const processed = processNode(child, childContext);
          if (processed) fragment.appendChild(processed);
        });

        // Skip empty elements (except breaks)
        if (!fragment.hasChildNodes() && targetTag !== 'br') {
          return null;
        }

        // Build Result Node
        let result: Node = fragment;

        // Apply visual wrappers based on styles or tag semantics
        // Inner-most: formatting
        if (targetTag === 'sub') result = wrap(result, 'sub');
        if (targetTag === 'sup') result = wrap(result, 'sup');
        if (targetTag === 'u' || hasUnderline) result = wrap(result, 'u');
        if (targetTag === 'i' || hasItalic) result = wrap(result, 'i');
        if (targetTag === 'b' || hasBold || isHeader || tagName === 'th') result = wrap(result, 'b');

        // Block wrappers
        if (targetTag === 'p') {
           // Unwrap paragraphs inside list items to prevent nesting issues in legacy systems
           if (context.insideListListItem) {
             return result; 
           }
           const p = document.createElement('p');
           p.appendChild(result);
           return p;
        }
        if (targetTag === 'br') {
           return document.createElement('br');
        }
        if (targetTag === 'ul') {
           const ul = document.createElement('ul');
           ul.appendChild(result);
           return ul;
        }
        if (targetTag === 'ol') {
           const ol = document.createElement('ol');
           ol.appendChild(result);
           return ol;
        }
        if (targetTag === 'li') {
           const li = document.createElement('li');
           li.appendChild(result);
           return li;
        }

        return result; // Fallback: return content unwrapped (flattened)
      }
      return null;
    };

    const wrap = (content: Node, tag: string) => {
      const el = document.createElement(tag);
      el.appendChild(content);
      return el;
    };

    // --- EXECUTE & POST-PROCESS ---
    const resultFragment = document.createDocumentFragment();
    Array.from(doc.body.childNodes).forEach(node => {
      const processed = processNode(node);
      if (processed) resultFragment.appendChild(processed);
    });

    const tempDiv = document.createElement('div');
    tempDiv.appendChild(resultFragment);

    // DOM-Based Cleanup (replacing fragile regex)

    // 1. Remove empty inline tags
    const cleanEmptyTags = (root: HTMLElement) => {
       // Loop backwards to handle nested empty tags safely
       const candidates = Array.from(root.querySelectorAll('b, i, u, sub, sup, p, li'));
       for (let i = candidates.length - 1; i >= 0; i--) {
          const el = candidates[i];
          // Check if empty or only whitespace (and contains no BRs)
          if (!el.textContent?.trim() && el.querySelectorAll('br').length === 0) {
             el.remove();
          }
       }
    };
    cleanEmptyTags(tempDiv);

    // 2. Paragraph vs Line Breaks
    if (!config.useParagraphs) {
       const ps = Array.from(tempDiv.querySelectorAll('p'));
       ps.forEach(p => {
          // Replace <p>content</p> with content<br><br>
          // Insert children before P
          while(p.firstChild) {
             p.parentNode?.insertBefore(p.firstChild, p);
          }
          // Add breaks
          p.parentNode?.insertBefore(document.createElement('br'), p);
          p.parentNode?.insertBefore(document.createElement('br'), p);
          p.remove();
       });
    }

    let finalHtml = tempDiv.innerHTML;

    // Final minimal trimming
    finalHtml = finalHtml.trim();
    
    // Remove leading BRs
    while (finalHtml.startsWith('<br>')) {
      finalHtml = finalHtml.substring(4);
    }
    while (finalHtml.endsWith('<br>')) {
      finalHtml = finalHtml.substring(0, finalHtml.length - 4);
    }

    return {
      html: finalHtml,
      stats: {
        originalLength: rawHtml.length,
        finalLength: finalHtml.length,
        tagsRemoved,
        attributesRemoved
      }
    };

  } catch (error: any) {
    console.error("Conversion Error:", error);
    return {
      html: '',
      stats: { originalLength: 0, finalLength: 0, tagsRemoved: 0, attributesRemoved: 0 },
      error: error.message || "An unexpected error occurred during processing."
    };
  }
};
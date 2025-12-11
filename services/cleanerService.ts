import { ConversionConfig, ProcessingStats } from '../types';

/**
 * STRICT LEGACY CLEANER (Style-Aware & Structure-Preserving)
 * 
 * Strategy:
 * 1. DOM Parse: Convert input to DOM.
 * 2. Walk & Detect Styles: 
 *    - Check `style` attributes for bold/italic/underline.
 * 3. Flattening with Context:
 *    - Handle nested blocks (like <p> inside <li>) to prevent broken lists.
 *    - Map Headers (h1-h6) to <p><b>...</b></p>.
 *    - Smart List Handling: Differentiate between UL (bullets) and OL (numbered).
 * 4. Regex Cleanup: Fix bullet formatting, whitespace, and empty tags.
 */

// Tags to ignore completely (content and all)
const IGNORE_TAGS = new Set([
  'script', 'style', 'svg', 'xml', 'head', 'meta', 'link', 'object', 'iframe', 'template', 'noscript', 'button', 'input', 'select', 'textarea'
]);

// Block tags that should generally trigger a paragraph or break
const BLOCK_TAGS = new Set([
  'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'article', 'section', 'nav', 'aside', 'header', 'footer', 'blockquote', 'pre', 'figure', 'li', 'tr', 'ul', 'ol', 'table'
]);

// Default mapping
const BASE_TAG_MAP: Record<string, string> = {
  'strong': 'b', 'b': 'b',
  'em': 'i', 'i': 'i', 'cite': 'i', 'var': 'i',
  'u': 'u', 'ins': 'u',
  'sub': 'sub', 'sup': 'sup',
  'br': 'br', 'hr': 'br',
  'p': 'p', 'div': 'p', 'blockquote': 'p', 'pre': 'p', 'address': 'p', 'center': 'p',
  'h1': 'p', 'h2': 'p', 'h3': 'p', 'h4': 'p', 'h5': 'p', 'h6': 'p',
  'article': 'p', 'section': 'p', 'main': 'p', 'nav': 'p', 'aside': 'p', 'header': 'p', 'footer': 'p',
  'ul': 'p', 'ol': 'p', 'dl': 'p',
  'li': 'br', 'dd': 'br', 'dt': 'b',
  'table': 'p', 'tr': 'br', 'td': 'span', 'th': 'b'
};

const isBoldStyle = (style: string) => /font-weight\s*:\s*(bold|700|800|900)/i.test(style);
const isItalicStyle = (style: string) => /font-style\s*:\s*italic/i.test(style);
const isUnderlineStyle = (style: string) => /text-decoration\s*:\s*underline/i.test(style);

interface ConversionContext {
  insideListListItem?: boolean;
  parentListType?: 'ul' | 'ol';
  listIndex?: number;
}

export const cleanHtml = (
  rawHtml: string, 
  config: ConversionConfig
): { html: string; stats: ProcessingStats; error?: string } => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');
    
    // Check for parser errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Malformed HTML structure detected.');
    }

    let tagsRemoved = 0;
    let attributesRemoved = 0;

    // --- PRE-CHECK: Plain Text Mode ---
    const allElements = Array.from(doc.body.getElementsByTagName('*'));
    const hasBlockStructure = allElements.some(el => BLOCK_TAGS.has(el.tagName.toLowerCase()));
    const treatAsPlainText = !hasBlockStructure && doc.body.textContent && doc.body.textContent.trim().length > 0;

    const processNode = (node: Node, context: ConversionContext = {}): Node | null => {
      // 1. Text Nodes
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.textContent) return null;
        let text = node.textContent;

        if (!treatAsPlainText) {
          // Standardize whitespace
          text = text.replace(/[\n\r]+/g, ' ');
          if (config.aggressiveWhitespace) {
            text = text.replace(/\s+/g, ' ');
          }
        }
        node.textContent = text;
        return node;
      }

      // 2. Element Nodes
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        if (IGNORE_TAGS.has(tagName)) {
          tagsRemoved++;
          return null;
        }

        // Detect Styles
        const styleAttr = el.getAttribute('style') || '';
        const hasBold = isBoldStyle(styleAttr);
        const hasItalic = isItalicStyle(styleAttr);
        const hasUnderline = isUnderlineStyle(styleAttr);
        const isHeader = /^h[1-6]$/.test(tagName);

        // Determine Target Tag
        let targetTag = BASE_TAG_MAP[tagName];

        // Context Override: Inside a list item, blocks should be flattened/converted to breaks
        if (context.insideListListItem && (targetTag === 'p' || isHeader || tagName === 'div')) {
           targetTag = 'br'; 
        }

        // List Indexing Logic for Ordered Lists
        let nextListIndex = 1;
        if (tagName === 'ol') {
           const startAttr = el.getAttribute('start');
           if (startAttr) {
             const parsed = parseInt(startAttr, 10);
             if (!isNaN(parsed)) nextListIndex = parsed;
           }
        }

        // Special visual prefix logic
        let prefix = '';
        if (tagName === 'li') {
          if (context.parentListType === 'ol' && context.listIndex !== undefined) {
             prefix = `${context.listIndex}. `;
          } else {
             prefix = '• '; 
          }
        } else if (tagName === 'td') {
          prefix = ' '; 
        }

        // Process Children
        const fragment = document.createDocumentFragment();
        if (prefix) {
          fragment.appendChild(document.createTextNode(prefix));
        }

        const childBaseContext: ConversionContext = {
          insideListListItem: tagName === 'li' || (context.insideListListItem && !BLOCK_TAGS.has(tagName)),
          parentListType: (tagName === 'ul' || tagName === 'ol') ? (tagName as 'ul' | 'ol') : context.parentListType
        };

        let hasContent = false;
        Array.from(el.childNodes).forEach(child => {
          // Pass index context if we are in an OL
          const childContext = { ...childBaseContext };
          if (tagName === 'ol' && child.nodeName.toLowerCase() === 'li') {
             childContext.listIndex = nextListIndex++;
          }

          const processed = processNode(child, childContext);
          if (processed) {
             const isWhitespace = processed.nodeType === Node.TEXT_NODE && !processed.textContent?.trim();
             if (isWhitespace && !treatAsPlainText) {
               fragment.appendChild(processed);
             } else {
               fragment.appendChild(processed);
               hasContent = true;
             }
          }
        });

        // If no content and not a break/td, skip
        if (!hasContent && targetTag !== 'br' && tagName !== 'td') {
           return null;
        }

        // Wrapping Logic
        let result: Node = fragment;

        // Wrap Inner Styles (Nested order: sup/sub -> u -> i -> b)
        
        if (targetTag === 'sub') {
             const subTag = document.createElement('sub');
             subTag.appendChild(result);
             result = subTag;
        }
        if (targetTag === 'sup') {
             const supTag = document.createElement('sup');
             supTag.appendChild(result);
             result = supTag;
        }

        if (targetTag === 'u' || hasUnderline) {
          const uTag = document.createElement('u');
          uTag.appendChild(result);
          result = uTag;
        }

        if (targetTag === 'i' || hasItalic) {
          const iTag = document.createElement('i');
          iTag.appendChild(result);
          result = iTag;
        }

        if (targetTag === 'b' || hasBold || isHeader || tagName === 'th') {
          const bTag = document.createElement('b');
          bTag.appendChild(result);
          result = bTag;
        }

        // Wrap Block/Break
        if (targetTag === 'p') {
          const pTag = document.createElement('p');
          pTag.appendChild(result);
          result = pTag;
        } else if (targetTag === 'br') {
          const wrapper = document.createDocumentFragment();
          wrapper.appendChild(document.createElement('br'));
          wrapper.appendChild(result);
          return wrapper;
        } else if (!targetTag) {
          // Flatten (span, font, etc)
          return result;
        }
        
        return result;
      }

      return null;
    };

    // --- EXECUTION ---
    const resultFragment = document.createDocumentFragment();
    Array.from(doc.body.childNodes).forEach(node => {
      const processed = processNode(node);
      if (processed) resultFragment.appendChild(processed);
    });

    const tempDiv = document.createElement('div');
    tempDiv.appendChild(resultFragment);
    let finalHtml = tempDiv.innerHTML;

    // --- REGEX CLEANUP ---

    // 1. Plain Text Newlines
    if (treatAsPlainText) {
      finalHtml = finalHtml.replace(/\n/g, '<br>');
    }

    // 2. Normalize BRs
    finalHtml = finalHtml.replace(/<br\s*\/?>/gi, '<br>');

    // 3. Fix List/Bullet Formatting
    finalHtml = finalHtml.replace(/(•|\d+\.)\s*<br>/g, '$1 ');
    
    // 4. Nested P Cleanup
    finalHtml = finalHtml.replace(/<p>\s*<p>/gi, '<p>');
    finalHtml = finalHtml.replace(/<\/p>\s*<\/p>/gi, '</p>');
    
    // 5. Remove leading breaks in paragraphs
    finalHtml = finalHtml.replace(/<p>\s*<br>/gi, '<p>');

    // 6. Paragraph Mode Check
    if (!config.useParagraphs) {
      finalHtml = finalHtml.replace(/<p>/gi, '').replace(/<\/p>/gi, '<br><br>');
    }

    // 7. Empty Tag Cleanup
    finalHtml = finalHtml.replace(/<b>\s*<\/b>/g, '');
    finalHtml = finalHtml.replace(/<i>\s*<\/i>/g, '');
    finalHtml = finalHtml.replace(/<u>\s*<\/u>/g, '');
    finalHtml = finalHtml.replace(/<sub>\s*<\/sub>/g, '');
    finalHtml = finalHtml.replace(/<sup>\s*<\/sup>/g, '');
    finalHtml = finalHtml.replace(/<p>\s*<\/p>/g, '');

    // 8. Final Trim
    finalHtml = finalHtml.trim();
    finalHtml = finalHtml.replace(/^(<br>)+/, '');
    finalHtml = finalHtml.replace(/(<br>)+$/, '');

    return {
      html: finalHtml,
      stats: {
        originalLength: rawHtml.length,
        finalLength: finalHtml.length,
        tagsRemoved,
        attributesRemoved
      }
    };
  } catch (error) {
    console.error("Conversion Error:", error);
    return {
      html: '',
      stats: { originalLength: 0, finalLength: 0, tagsRemoved: 0, attributesRemoved: 0 },
      error: "Could not parse the provided content. It may contain unsupported binary data or malformed tags."
    };
  }
};
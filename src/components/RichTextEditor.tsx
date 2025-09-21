'use client';

import { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Eraser
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [currentAlignment, setCurrentAlignment] = useState('left');

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      handleInput();
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    // Try to get HTML content first (preserves formatting)
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    
    if (html) {
      // Clean the HTML to remove unwanted styles but keep basic formatting
      const cleanHtml = cleanPastedHtml(html);
      document.execCommand('insertHTML', false, cleanHtml);
    } else if (text) {
      // Fallback to plain text
      document.execCommand('insertText', false, text);
    }
    
    // Ensure LTR direction on pasted content
    setTimeout(() => {
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const container = range.commonAncestorContainer;
          const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement;
          
          if (element) {
            element.style.direction = 'ltr';
          }
        }
      }
    }, 0);
    
    handleInput();
  };

  const cleanPastedHtml = (html: string): string => {
    // Create a temporary div to parse and clean the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove unwanted elements and attributes
    const unwantedElements = tempDiv.querySelectorAll('script, style, meta, link, title, head, body, html');
    unwantedElements.forEach(el => el.remove());
    
    // Clean up inline styles but keep basic formatting
    const elements = tempDiv.querySelectorAll('*');
    elements.forEach(el => {
      const element = el as HTMLElement;
      
      // Keep only essential styles for formatting
      const allowedStyles = ['font-weight', 'font-style', 'text-decoration', 'text-align'];
      const currentStyles = element.style;
      
      // Remove all styles first
      element.removeAttribute('style');
      
      // Re-apply only allowed styles
      allowedStyles.forEach(style => {
        const styleValue = currentStyles.getPropertyValue(style);
        if (styleValue) {
          element.style.setProperty(style, styleValue);
        }
      });
      
      // Remove unwanted attributes
      element.removeAttribute('class');
      element.removeAttribute('id');
      element.removeAttribute('data-*');
    });
    
    return tempDiv.innerHTML;
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const setTextColor = () => {
    const color = prompt('Enter color (e.g., #ff0000, red, blue):');
    if (color) {
      execCommand('foreColor', color);
    }
  };

  const setBackgroundColor = () => {
    const color = prompt('Enter background color (e.g., #ffff00, yellow, lightblue):');
    if (color) {
      execCommand('hiliteColor', color);
    }
  };

  const setTextAlign = (alignment: string) => {
    if (alignment === 'center') {
      execCommand('justifyCenter');
    } else if (alignment === 'right') {
      execCommand('justifyRight');
    } else if (alignment === 'justify') {
      execCommand('justifyFull');
    } else {
      execCommand('justifyLeft');
    }
    
    // Force LTR direction on the current selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement;
      
      if (element) {
        element.style.direction = 'ltr';
        element.style.textAlign = alignment;
      }
    }
  };

  const ToolbarButton = ({ 
    icon: Icon, 
    command, 
    value, 
    onClick, 
    title,
    isActive = false
  }: { 
    icon: React.ComponentType<{ className?: string }>; 
    command?: string; 
    value?: string; 
    onClick?: () => void; 
    title: string; 
    isActive?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick || (() => execCommand(command!, value))}
      className={`p-2 rounded transition-colors ${
        isActive 
          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
          : 'hover:bg-gray-100'
      }`}
      title={title}
      disabled={disabled}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className={`rich-text-editor border border-gray-300 rounded-md ${className} ${isFocused ? 'ring-2 ring-blue-500' : ''}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50 rounded-t-md flex flex-wrap gap-1">
        <div className="flex gap-1">
          <ToolbarButton icon={Heading1} command="formatBlock" value="h1" title="Heading 1" />
          <ToolbarButton icon={Heading2} command="formatBlock" value="h2" title="Heading 2" />
          <ToolbarButton icon={Heading3} command="formatBlock" value="h3" title="Heading 3" />
        </div>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <div className="flex gap-1">
          <ToolbarButton icon={Bold} command="bold" title="Bold" />
          <ToolbarButton icon={Italic} command="italic" title="Italic" />
          <ToolbarButton icon={Underline} command="underline" title="Underline" />
        </div>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <div className="flex gap-1">
          <ToolbarButton icon={List} command="insertUnorderedList" title="Bullet List" />
          <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Numbered List" />
        </div>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <div className="flex gap-1">
          <ToolbarButton 
            icon={AlignLeft} 
            onClick={() => {
              setTextAlign('left');
              setCurrentAlignment('left');
            }} 
            title="Align Left" 
            isActive={currentAlignment === 'left'}
          />
          <ToolbarButton 
            icon={AlignCenter} 
            onClick={() => {
              setTextAlign('center');
              setCurrentAlignment('center');
            }} 
            title="Align Center" 
            isActive={currentAlignment === 'center'}
          />
          <ToolbarButton 
            icon={AlignRight} 
            onClick={() => {
              setTextAlign('right');
              setCurrentAlignment('right');
            }} 
            title="Align Right" 
            isActive={currentAlignment === 'right'}
          />
          <ToolbarButton 
            icon={AlignJustify} 
            onClick={() => {
              setTextAlign('justify');
              setCurrentAlignment('justify');
            }} 
            title="Justify" 
            isActive={currentAlignment === 'justify'}
          />
        </div>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <div className="flex gap-1">
          <ToolbarButton icon={Link} onClick={insertLink} title="Insert Link" />
        </div>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <div className="flex gap-1">
          <button
            type="button"
            onClick={setTextColor}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Text Color"
            disabled={disabled}
          >
            <div className="w-4 h-4 border border-gray-300 rounded" style={{ backgroundColor: '#000' }}></div>
          </button>
          <button
            type="button"
            onClick={setBackgroundColor}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Background Color"
            disabled={disabled}
          >
            <div className="w-4 h-4 border border-gray-300 rounded" style={{ backgroundColor: '#ffff00' }}></div>
          </button>
        </div>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <ToolbarButton icon={Eraser} command="removeFormat" title="Clear Formatting" />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`min-h-[120px] p-3 outline-none ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        style={{
          direction: 'ltr',
          textAlign: 'left',
        }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        .rich-text-editor [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
          pointer-events: none;
        }
        
        .rich-text-editor [contenteditable] h1,
        .rich-text-editor [contenteditable] h2,
        .rich-text-editor [contenteditable] h3,
        .rich-text-editor [contenteditable] h4,
        .rich-text-editor [contenteditable] h5,
        .rich-text-editor [contenteditable] h6 {
          margin: 0.5em 0;
          font-weight: 600;
        }
        
        .rich-text-editor [contenteditable] h1 { font-size: 1.5em; }
        .rich-text-editor [contenteditable] h2 { font-size: 1.3em; }
        .rich-text-editor [contenteditable] h3 { font-size: 1.1em; }
        
        .rich-text-editor [contenteditable] p {
          margin: 0.5em 0;
        }
        
        .rich-text-editor [contenteditable] div {
          text-align: left;
        }
        
        .rich-text-editor [contenteditable] ul {
          list-style: none;
          margin: 0.5em 0;
          padding-left: 1.5em;
          padding-right: 0;
        }
        
        .rich-text-editor [contenteditable] ul li {
          position: relative;
          margin: 0.25em 0;
        }
        
        .rich-text-editor [contenteditable] ul li::before {
          content: "•";
          position: absolute;
          left: -1.5em;
          font-weight: bold;
        }
        
        .rich-text-editor [contenteditable] ol {
          counter-reset: item;
          list-style: none;
          margin: 0.5em 0;
          padding-left: 1.5em;
          padding-right: 0;
        }
        
        .rich-text-editor [contenteditable] ol li {
          counter-increment: item;
          position: relative;
          margin: 0.25em 0;
        }
        
        .rich-text-editor [contenteditable] ol li::before {
          content: counter(item) ".";
          position: absolute;
          left: -1.5em;
          font-weight: bold;
        }
        
        .rich-text-editor [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .rich-text-editor [contenteditable] img {
          max-width: 100%;
          height: auto;
          margin: 0.5em 0;
        }
        
        .rich-text-editor [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          border-right: none;
          margin: 1em 0;
          padding: 0 0 0 1em;
          color: #6b7280;
        }
        
        .rich-text-editor [contenteditable] {
          direction: ltr !important;
          text-align: left !important;
        }
        
        .rich-text-editor [contenteditable] * {
          direction: ltr !important;
        }
        
        .rich-text-editor [contenteditable] p {
          margin: 0.5em 0;
          direction: ltr !important;
          text-align: inherit;
        }
        
        .rich-text-editor [contenteditable] div {
          text-align: inherit;
          direction: ltr !important;
        }
      `}</style>
    </div>
  );
} 
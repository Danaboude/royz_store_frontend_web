import React from 'react';

interface DocxRendererProps {
  docxUrl: string;
}

const DocxRenderer: React.FC<DocxRendererProps> = ({ docxUrl }) => {
  // Placeholder: In a real implementation, fetch and render the docx file as HTML
  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-4 text-gray-700">
      <span>DOCX description would be rendered from: </span>
      <code className="break-all">{docxUrl}</code>
    </div>
  );
};

export default DocxRenderer; 
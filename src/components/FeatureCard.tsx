import React from 'react';

interface FeatureCardProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-md p-6 min-w-[120px] min-h-[160px] border border-[#F5CD79]">
      <div className="w-16 h-16 rounded-full bg-[#F5CD79] flex items-center justify-center mb-4">
        {icon || <span className="text-3xl">●</span>}
      </div>
      <div className="font-bold text-lg text-[#2C2C54] text-center mb-1">{title}</div>
      {description && <div className="text-sm text-[#2C2C54] text-center opacity-80">{description}</div>}
    </div>
  );
};

export default FeatureCard; 
import React from 'react';

interface ActionBarProps {
  left?: React.ReactNode;
  children: React.ReactNode;
}

export const ActionBar: React.FC<ActionBarProps> = ({ left, children }) => {
  return (
    <div className="sticky bottom-0 -mx-6 lg:-mx-10 mt-8 border-t border-line bg-bg/95 backdrop-blur px-6 lg:px-10 py-4 flex items-center justify-between gap-4 z-20 shadow-lg">
      <div className="text-sub text-[14px] font-medium">{left}</div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
};

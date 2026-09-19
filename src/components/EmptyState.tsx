import React from 'react';
import { UserX, PlusCircle, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  isSearch: boolean;
  onAddPerson: () => void;
  onResetSearch: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isSearch,
  onAddPerson,
  onResetSearch
}) => {
  return (
    <div
      id="collection-empty-state"
      className="w-full py-16 px-6 bg-white/70 backdrop-blur-xs rounded-3xl border border-[#EDE7DF] shadow-xs flex flex-col items-center justify-center text-center max-w-lg mx-auto"
    >
      <div className="w-16 h-16 rounded-full bg-[#F4EFEB] flex items-center justify-center mb-4 text-[#8C847B]">
        <UserX className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold text-[#1F2421] mb-2 font-display">
        {isSearch ? 'No person found' : 'Your collection is empty.'}
      </h3>

      <p className="text-sm text-[#706A62] max-w-xs mb-6">
        {isSearch
          ? 'We could not find anyone matching your search or filters. Try adjusting your query.'
          : 'Add your first person to get started building your personal archive.'}
      </p>

      <div className="flex items-center space-x-3">
        {isSearch ? (
          <button
            id="empty-state-reset-btn"
            onClick={onResetSearch}
            className="px-5 py-2.5 bg-[#FAF8F5] border border-[#D5CDC4] text-[#1F2421] rounded-full text-sm font-medium hover:bg-[#EAE4DC] transition-colors flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Search</span>
          </button>
        ) : (
          <button
            id="empty-state-add-btn"
            onClick={onAddPerson}
            className="px-6 py-2.5 bg-[#1F2421] text-white rounded-full text-sm font-medium hover:bg-[#333A36] transition-colors flex items-center space-x-2 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Person</span>
          </button>
        )}
      </div>
    </div>
  );
};

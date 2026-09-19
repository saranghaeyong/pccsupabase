import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  totalCount: number;
  filteredCount: number;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  totalCount,
  filteredCount,
  inputRef
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* Search Input Box */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-[#8C847B]" />
        </div>

        <input
          ref={inputRef}
          id="person-search-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search people..."
          aria-label="Search people by name, age, or date of birth"
          className="w-full pl-12 pr-12 py-3.5 bg-white text-[#1F2421] placeholder-[#9E968D] rounded-full border border-[#E0D8CE] shadow-xs focus:outline-none focus:border-[#1F2421] focus:ring-2 focus:ring-[#1F2421]/15 text-sm sm:text-base transition-all duration-200"
        />

        {value && (
          <button
            id="clear-search-btn"
            onClick={() => onChange('')}
            aria-label="Clear search input"
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#8C847B] hover:text-[#1F2421] transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-[#EAE4DC] flex items-center justify-center hover:bg-[#DCD4C8]">
              <X className="w-3.5 h-3.5" />
            </div>
          </button>
        )}
      </div>

      {/* Counter below search */}
      <div className="mt-3.5 flex items-center space-x-2 text-xs sm:text-sm text-[#706A62]">
        <span className="font-semibold text-[#2D2A26]">Total People: {totalCount}</span>
        {value.trim() && (
          <>
            <span className="text-[#C7BEB4]">•</span>
            <span className="text-[#529E72] font-medium">
              Found {filteredCount} {filteredCount === 1 ? 'match' : 'matches'}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

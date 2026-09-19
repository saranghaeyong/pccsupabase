import React, { useState } from 'react';
import { SortOption, FilterOptions } from '../types';
import { ArrowUpDown, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset
}) => {
  const [showAgeFilter, setShowAgeFilter] = useState(false);

  const sortButtons: { id: SortOption; label: string }[] = [
    { id: 'newest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' },
    { id: 'alpha-asc', label: 'A → Z' },
    { id: 'alpha-desc', label: 'Z → A' },
    { id: 'age-asc', label: 'Youngest' },
    { id: 'age-desc', label: 'Eldest' }
  ];

  const handleSortChange = (sortBy: SortOption) => {
    onFilterChange({
      ...filters,
      sortBy
    });
  };

  const handleAgeChange = (minAge: number | null, maxAge: number | null) => {
    onFilterChange({
      ...filters,
      minAge,
      maxAge
    });
  };

  const hasActiveFilters =
    filters.sortBy !== 'newest' ||
    filters.minAge !== null ||
    filters.maxAge !== null;

  return (
    <div className="w-full flex flex-col items-center space-y-3">
      {/* Horizontal Sort Pills */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE4DC] pb-4">
        
        {/* Left: Sorting options */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          <div className="flex items-center text-xs font-semibold text-[#8C847B] uppercase tracking-wider mr-1 sm:mr-2">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
            Sort:
          </div>

          {sortButtons.map((btn) => {
            const isActive = filters.sortBy === btn.id;
            return (
              <button
                key={btn.id}
                id={`sort-btn-${btn.id}`}
                onClick={() => handleSortChange(btn.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 ${
                  isActive
                    ? 'bg-[#1F2421] text-[#FAF8F5] shadow-xs'
                    : 'bg-[#F2EDE6] text-[#5C5650] hover:bg-[#E5DFD6] hover:text-[#1F2421]'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Right: Age filter toggle and reset */}
        <div className="flex items-center space-x-2">
          <button
            id="filter-age-toggle-btn"
            onClick={() => setShowAgeFilter(!showAgeFilter)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center space-x-1.5 transition-colors ${
              filters.minAge !== null || filters.maxAge !== null || showAgeFilter
                ? 'bg-[#EAE4DC] text-[#1F2421]'
                : 'bg-[#F2EDE6] text-[#6B655E] hover:bg-[#E5DFD6]'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Age Filter</span>
            {(filters.minAge !== null || filters.maxAge !== null) && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#529E72]" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              id="filter-reset-btn"
              onClick={onReset}
              className="p-1.5 text-xs text-[#8C847B] hover:text-[#1F2421] rounded-full hover:bg-[#EAE4DC] transition-colors"
              title="Reset all filters"
              aria-label="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Age Filter Bar */}
      {showAgeFilter && (
        <div className="w-full bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E2DA] shadow-xs flex flex-wrap items-center gap-4 animate-in fade-in duration-200">
          <div className="text-xs font-semibold text-[#423E39]">Filter by Age Bracket:</div>
          
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'All Ages', min: null, max: null },
              { label: 'Under 25', min: null, max: 24 },
              { label: '25 – 35', min: 25, max: 35 },
              { label: '36 – 50', min: 36, max: 50 },
              { label: '50+', min: 50, max: null },
            ].map((bracket, idx) => {
              const isSelected = filters.minAge === bracket.min && filters.maxAge === bracket.max;
              return (
                <button
                  key={idx}
                  onClick={() => handleAgeChange(bracket.min, bracket.max)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-[#1F2421] text-white font-medium'
                      : 'bg-[#F7F5F0] text-[#5C5650] hover:bg-[#EAE4DC]'
                  }`}
                >
                  {bracket.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

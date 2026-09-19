import React from 'react';
import { Person, FilterOptions } from '../types';
import { SearchBar } from '../components/SearchBar';
import { FilterBar } from '../components/FilterBar';
import { PersonGrid } from '../components/PersonGrid';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { Database, Plus, Radio, AlertCircle } from 'lucide-react';

interface CollectionPageProps {
  people: Person[];
  loading: boolean;
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onResetFilters: () => void;
  onCardClick: (person: Person) => void;
  onAddPersonClick: () => void;
  onDeletePerson?: (person: Person) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  isSupabaseConfigured: boolean;
  databaseError?: string;
  onOpenSetupModal: () => void;
}

export const CollectionPage: React.FC<CollectionPageProps> = ({
  people,
  loading,
  filters,
  onFilterChange,
  onResetFilters,
  onCardClick,
  onAddPersonClick,
  onDeletePerson,
  searchInputRef,
  isSupabaseConfigured,
  databaseError,
  onOpenSetupModal
}) => {
  return (
    <div className="w-full pb-20">
      {/* Hero Section */}
      <section className="pt-8 pb-6 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-[#1F2421] font-display">
          Person Card Collection
        </h2>
        <p className="mt-2.5 text-base sm:text-lg text-[#6B655E] max-w-xl mx-auto">
          A shared digital collection of people powered by Supabase.
        </p>

        {/* Database Status Pill */}
        <div className="mt-4 inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#FAF8F5] border border-[#EAE4DC] text-xs text-[#706A62]">
          {isSupabaseConfigured && !databaseError ? (
            <>
              <Radio className="w-3.5 h-3.5 text-[#3ECF8E] animate-pulse shrink-0" />
              <span>Shared Supabase Database • Realtime updates enabled</span>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenSetupModal}
              className="inline-flex items-center space-x-1.5 text-[#B45309] hover:underline"
            >
              <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
              <span>
                {databaseError ? 'Database setup required • Click to view SQL' : 'Connect Supabase for live shared storage'}
              </span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mt-6">
          <SearchBar
            inputRef={searchInputRef}
            value={filters.searchQuery}
            onChange={(val) => onFilterChange({ ...filters, searchQuery: val })}
            totalCount={people.length}
            filteredCount={people.length}
          />
        </div>
      </section>

      {/* Main Collection Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Filters & Sorting + Add Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-grow">
            <FilterBar
              filters={filters}
              onFilterChange={onFilterChange}
              onReset={onResetFilters}
            />
          </div>

          <button
            type="button"
            id="add-person-quick-btn"
            onClick={onAddPersonClick}
            className="self-end sm:self-auto px-4.5 py-2.5 bg-[#1F2421] hover:bg-[#000000] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Card</span>
          </button>
        </div>

        {/* Content States: Loading, Empty, or Grid */}
        {loading ? (
          <LoadingSkeleton count={8} />
        ) : people.length === 0 ? (
          <EmptyState
            isSearch={!!filters.searchQuery.trim() || filters.minAge !== null || filters.maxAge !== null}
            onAddPerson={onAddPersonClick}
            onResetSearch={onResetFilters}
          />
        ) : (
          <PersonGrid
            people={people}
            onCardClick={onCardClick}
            onDeletePerson={onDeletePerson}
          />
        )}
      </main>
    </div>
  );
};

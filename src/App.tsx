import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Person, PersonFormData, FilterOptions } from './types';
import { fetchPeople, createPerson, deletePerson, subscribeToPeopleChanges } from './services/peopleService';
import { isSupabaseConfigured } from './lib/supabase';
import { Header } from './components/Header';
import { CollectionPage } from './pages/CollectionPage';
import { AddEditPersonPage } from './pages/AddEditPersonPage';
import { PersonDetailModal } from './components/PersonDetailModal';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { Database, Radio } from 'lucide-react';

export default function App() {
  // Navigation View State
  const [currentView, setCurrentView] = useState<'collection' | 'add-person'>('collection');

  // People Collection State
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());
  const [databaseError, setDatabaseError] = useState<string | undefined>();

  // Filter & Search State
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    sortBy: 'newest',
    minAge: null,
    maxAge: null
  });

  // Modal States
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load people from Supabase database
  const loadPeople = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchPeople(filters);
      setPeople(result.people);
      setIsConfigured(result.isConfigured);
      setDatabaseError(result.error);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database error';
      setDatabaseError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load and whenever filters change
  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  // Realtime subscription: auto-updates collection when another visitor adds a card
  useEffect(() => {
    const unsubscribe = subscribeToPeopleChanges(() => {
      loadPeople();
    });
    return unsubscribe;
  }, [loadPeople]);

  // URL routing synchronization
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/add-person') {
        setCurrentView('add-person');
      } else {
        setCurrentView('collection');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (view: 'collection' | 'add-person') => {
    setCurrentView(view);
    const targetPath = view === 'add-person' ? '/add-person' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save Person (Uploads photo to Supabase Storage -> Saves to Supabase Database)
  const handleSavePerson = async (
    formData: PersonFormData,
    onStepChange?: (step: 'validating' | 'uploading' | 'saving' | 'done') => void
  ) => {
    try {
      const created = await createPerson(formData, onStepChange);
      if (created.storageWarning) {
        showToast('Card created! Saved with optimized portrait data (Storage RLS policy restricted bucket).', 'info');
      } else {
        showToast('Person card created and saved to shared database!');
      }
      await loadPeople();
      navigateTo('collection');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save person card.';
      showToast(msg, 'error');
      throw err;
    }
  };

  // Delete Person (1. Delete image from Storage, 2. Delete database record)
  const handleDeletePerson = async (personId: string, photoUrl?: string) => {
    try {
      await deletePerson(personId, photoUrl);
      showToast('Person card deleted successfully');
      setSelectedPerson(null);
      await loadPeople();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete person card';
      showToast(msg, 'error');
      throw err;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1F2421] selection:bg-[#EAE4DC] selection:text-[#1F2421]">
      {/* Global Navigation Header */}
      <Header
        currentView={currentView}
        onNavigate={navigateTo}
        onOpenSetupGuide={() => setIsSetupModalOpen(true)}
        isSupabaseConnected={isConfigured && !databaseError}
        onFocusSearch={() => {
          if (currentView !== 'collection') {
            navigateTo('collection');
          }
          setTimeout(() => {
            searchInputRef.current?.focus();
            searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 max-w-md px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center space-x-2 animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]'
              : toastMessage.type === 'info'
              ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
              : 'bg-[#1F2421] text-white border-[#333A36]'
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-grow">
        {currentView === 'collection' && (
          <CollectionPage
            people={people}
            loading={loading}
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={() =>
              setFilters({
                searchQuery: '',
                sortBy: 'newest',
                minAge: null,
                maxAge: null
              })
            }
            onCardClick={(person) => setSelectedPerson(person)}
            onAddPersonClick={() => navigateTo('add-person')}
            onDeletePerson={(person) => setSelectedPerson(person)}
            searchInputRef={searchInputRef}
            isSupabaseConfigured={isConfigured}
            databaseError={databaseError}
            onOpenSetupModal={() => setIsSetupModalOpen(true)}
          />
        )}

        {currentView === 'add-person' && (
          <AddEditPersonPage
            onSave={handleSavePerson}
            onCancel={() => navigateTo('collection')}
          />
        )}
      </div>

      {/* Person Detail Modal */}
      <PersonDetailModal
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
        onDelete={handleDeletePerson}
      />

      {/* Supabase Setup & Instructions Modal */}
      <SupabaseSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        isConfigured={isConfigured}
        errorMessage={databaseError}
        onRetry={loadPeople}
      />

      {/* Shared Database Footer */}
      <footer className="mt-auto border-t border-[#EAE4DC] py-8 bg-[#F4EFEB]/60 text-center text-xs text-[#8C847B]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-[#529E72]">
            <Database className="w-4 h-4 text-[#3ECF8E] shrink-0" />
            <span className="text-[#423E39] font-medium">
              Powered by Supabase PostgreSQL Database & Storage
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              id="footer-supabase-guide-btn"
              onClick={() => setIsSetupModalOpen(true)}
              className="text-[#706A62] hover:text-[#1F2421] transition-colors"
            >
              Supabase Configuration & SQL
            </button>
            <span>•</span>
            <p>© {new Date().getFullYear()} Person Card Collection</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

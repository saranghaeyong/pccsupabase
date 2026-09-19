export interface Person {
  id: string;
  name: string;
  age: number;
  date_of_birth: string; // YYYY-MM-DD
  photo_url: string; // Public Supabase Storage URL
  created_at?: string;
  updated_at?: string;

  // Aliases for seamless component compatibility
  dateOfBirth?: string;
  image?: string;
  createdAt?: string;
  storageWarning?: string;
}

export interface PersonFormData {
  name: string;
  age: number | string;
  date_of_birth: string;
  photo_file?: File | null;
  photo_preview?: string;
  photo_url?: string;

  // Aliases
  dateOfBirth?: string;
  image?: string;
}

export type SortOption = 'newest' | 'oldest' | 'alpha-asc' | 'alpha-desc' | 'age-asc' | 'age-desc';

export interface FilterOptions {
  searchQuery: string;
  sortBy: SortOption;
  minAge?: number | null;
  maxAge?: number | null;
}

export interface ValidationErrors {
  name?: string;
  age?: string;
  date_of_birth?: string;
  dateOfBirth?: string;
  photo?: string;
  image?: string;
  general?: string;
}

export type SupabaseStatus = 'connected' | 'unconfigured' | 'table_missing' | 'error';

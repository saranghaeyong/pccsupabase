import { Person, PersonFormData, FilterOptions } from '../types';
import { supabase, isSupabaseConfigured, STORAGE_BUCKET, TABLE_PEOPLE } from '../lib/supabase';
import { SAMPLE_PEOPLE } from '../data/initialPeople';
import { optimizeImageToDataUrl } from '../utils/imageOptimizer';

/**
 * Normalizes database record into a consistent Person object with helper aliases.
 */
export function normalizePersonRecord(record: any): Person {
  const dob = record.date_of_birth || record.dateOfBirth || '';
  const photo = record.photo_url || record.image || '';
  const createdAt = record.created_at || record.createdAt || new Date().toISOString();

  return {
    id: record.id,
    name: record.name,
    age: typeof record.age === 'number' ? record.age : parseInt(record.age, 10) || 0,
    date_of_birth: dob,
    photo_url: photo,
    created_at: createdAt,
    updated_at: record.updated_at,
    // Aliases
    dateOfBirth: dob,
    image: photo,
    createdAt: createdAt
  };
}

/**
 * Fetches all people from the Supabase database with filtering, search, and sorting.
 * Newest cards appear first by default.
 */
export async function fetchPeople(filters?: FilterOptions): Promise<{
  people: Person[];
  isConfigured: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    // If Supabase is not configured yet, display sample data with a configuration hint
    let fallback = [...SAMPLE_PEOPLE];
    if (filters?.searchQuery?.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      fallback = fallback.filter((p) => {
        const matchName = p.name.toLowerCase().includes(q);
        const matchAge = p.age.toString() === q || p.age.toString().includes(q);
        const matchDOB = (p.date_of_birth || '').toLowerCase().includes(q);
        return matchName || matchAge || matchDOB;
      });
    }
    return {
      people: fallback,
      isConfigured: false
    };
  }

  try {
    let query = supabase.from(TABLE_PEOPLE).select('*');

    // Age range filters applied in SQL
    if (filters?.minAge !== null && filters?.minAge !== undefined) {
      query = query.gte('age', filters.minAge);
    }
    if (filters?.maxAge !== null && filters?.maxAge !== undefined) {
      query = query.lte('age', filters.maxAge);
    }

    // Search by name, age, or date_of_birth
    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim();
      const num = parseInt(q, 10);
      if (!isNaN(num) && num.toString() === q) {
        // Search by age equality OR substring in name / DOB
        query = query.or(`age.eq.${num},name.ilike.%${q}%,date_of_birth.cast.text.ilike.%${q}%`);
      } else {
        query = query.or(`name.ilike.%${q}%,date_of_birth.cast.text.ilike.%${q}%`);
      }
    }

    // Sorting (Newest cards first by default)
    switch (filters?.sortBy) {
      case 'alpha-asc':
        query = query.order('name', { ascending: true });
        break;
      case 'alpha-desc':
        query = query.order('name', { ascending: false });
        break;
      case 'age-asc':
        query = query.order('age', { ascending: true });
        break;
      case 'age-desc':
        query = query.order('age', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase fetch error:', error);
      // If table does not exist in schema cache
      if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('relation "public.people" does not exist')) {
        return {
          people: SAMPLE_PEOPLE,
          isConfigured: true,
          error: 'The "people" table was not found in Supabase. Run supabase/schema.sql in the Supabase SQL Editor.'
        };
      }
      return {
        people: SAMPLE_PEOPLE,
        isConfigured: true,
        error: error.message
      };
    }

    const people = (data || []).map(normalizePersonRecord);
    return { people, isConfigured: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to connect to database.';
    return {
      people: SAMPLE_PEOPLE,
      isConfigured: true,
      error: msg
    };
  }
}

/**
 * Uploads a portrait photo to the Supabase Storage bucket `person-photos`.
 * Returns the public URL and internal file path.
 */
export async function uploadPersonPhoto(file: File): Promise<{
  publicUrl: string;
  filePath: string;
  usedFallback: boolean;
  warning?: string;
}> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }

  // Derive file extension
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg';
  const filePath = `portraits/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${cleanExtension}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '31536000',
        upsert: false,
        contentType: file.type || 'image/jpeg'
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError.message);
      const isRlsError =
        uploadError.message?.toLowerCase().includes('row-level security') ||
        uploadError.message?.toLowerCase().includes('violates');
      const isBucketMissing =
        uploadError.message?.toLowerCase().includes('bucket not found') ||
        uploadError.message?.toLowerCase().includes('not found');

      // Graceful Fallback: Convert image into an optimized, compact Data URL
      // This prevents blocking card creation when Supabase Storage RLS is not yet configured.
      if (isRlsError || isBucketMissing) {
        console.info('Falling back to optimized portrait data URL for card creation.');
        const optimizedDataUrl = await optimizeImageToDataUrl(file);
        return {
          publicUrl: optimizedDataUrl,
          filePath: '',
          usedFallback: true,
          warning: isRlsError
            ? 'Supabase Storage RLS upload policy not enabled in Supabase; saved using optimized portrait data.'
            : 'Storage bucket not ready; saved using optimized portrait data.'
        };
      }

      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Could not retrieve public image URL after upload.');
    }

    return {
      publicUrl: publicUrlData.publicUrl,
      filePath,
      usedFallback: false
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('violates')) {
      console.info('Catching storage RLS error and falling back to optimized portrait data URL.');
      const optimizedDataUrl = await optimizeImageToDataUrl(file);
      return {
        publicUrl: optimizedDataUrl,
        filePath: '',
        usedFallback: true,
        warning: 'Supabase Storage RLS upload policy not enabled in Supabase; saved using optimized portrait data.'
      };
    }
    throw err;
  }
}

/**
 * Creates a person card in the Supabase database.
 * If an image file is attached, uploads to Supabase Storage first.
 * If database insertion fails after an image upload, removes the orphaned image.
 */
export async function createPerson(
  formData: PersonFormData,
  onStepChange?: (step: 'validating' | 'uploading' | 'saving' | 'done') => void
): Promise<Person> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase environment variables are missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }

  let photoUrl = formData.photo_url || formData.image || '';
  let uploadedFilePath: string | null = null;
  let uploadWarning: string | undefined = undefined;

  // Step 1: Upload photo if a new file is provided
  if (formData.photo_file) {
    onStepChange?.('uploading');
    const uploadResult = await uploadPersonPhoto(formData.photo_file);
    photoUrl = uploadResult.publicUrl;
    uploadedFilePath = uploadResult.filePath;
    uploadWarning = uploadResult.warning;
  }

  if (!photoUrl) {
    throw new Error('Photo is required. Please upload an image.');
  }

  // Step 2: Insert person record into database
  onStepChange?.('saving');
  const ageNumber = typeof formData.age === 'number' ? formData.age : parseInt(formData.age, 10);
  const dob = formData.date_of_birth || formData.dateOfBirth || '';

  const { data, error: dbError } = await supabase
    .from(TABLE_PEOPLE)
    .insert([
      {
        name: formData.name.trim(),
        age: ageNumber,
        date_of_birth: dob,
        photo_url: photoUrl
      }
    ])
    .select()
    .single();

  if (dbError) {
    console.error('Database insert error:', dbError);
    // Cleanup orphaned uploaded image if database insert fails
    if (uploadedFilePath) {
      try {
        await supabase.storage.from(STORAGE_BUCKET).remove([uploadedFilePath]);
      } catch (cleanupErr) {
        console.warn('Failed to clean up orphaned image:', cleanupErr);
      }
    }

    if (dbError.message?.toLowerCase().includes('row-level security') || dbError.message?.toLowerCase().includes('violates')) {
      throw new Error(
        `Database RLS policy is blocking card creation on table "people". In Supabase SQL Editor, run: CREATE POLICY "Allow public insert to people" ON public.people FOR INSERT TO anon, authenticated WITH CHECK (true);`
      );
    }

    throw new Error(`Database error: ${dbError.message}`);
  }

  onStepChange?.('done');
  const record = normalizePersonRecord(data);
  if (uploadWarning) {
    record.storageWarning = uploadWarning;
  }
  return record;
}

/**
 * Extracts relative storage object path from a Supabase storage URL or path.
 */
export function extractStoragePath(photoUrlOrPath?: string): string | null {
  if (!photoUrlOrPath) return null;
  // Base64 data URLs and external URLs are not in the storage bucket
  if (photoUrlOrPath.startsWith('data:') || photoUrlOrPath.startsWith('blob:')) {
    return null;
  }

  // If already relative path inside person-photos
  if (photoUrlOrPath.startsWith('portraits/')) {
    return photoUrlOrPath;
  }

  const bucketToken = `/${STORAGE_BUCKET}/`;
  if (photoUrlOrPath.includes(bucketToken)) {
    const afterBucket = photoUrlOrPath.split(bucketToken)[1];
    if (afterBucket) {
      return decodeURIComponent(afterBucket.split('?')[0]);
    }
  }

  return null;
}

/**
 * Deletes a person record and removes their associated photo from Supabase Storage.
 *
 * 1. Delete the image from Storage:
 *    await supabase.storage.from('person-photos').remove([imagePath])
 *
 * 2. Delete the database record:
 *    await supabase.from('people').delete().eq('id', personId)
 */
export async function deletePerson(personId: string, photoUrlOrPath?: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const index = SAMPLE_PEOPLE.findIndex((p) => p.id === personId);
    if (index !== -1) {
      SAMPLE_PEOPLE.splice(index, 1);
    }
    return;
  }

  // 1. Delete the image from Storage
  const imagePath = extractStoragePath(photoUrlOrPath);
  if (imagePath) {
    try {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([imagePath]);

      if (storageError) {
        console.warn('Storage image deletion warning:', storageError.message);
      }
    } catch (storageErr) {
      console.warn('Failed to delete image from Supabase storage:', storageErr);
    }
  }

  // 2. Delete the database record
  const { error: dbError } = await supabase
    .from(TABLE_PEOPLE)
    .delete()
    .eq('id', personId);

  if (dbError) {
    console.error('Database delete error:', dbError);
    if (dbError.message?.toLowerCase().includes('row-level security') || dbError.message?.toLowerCase().includes('violates')) {
      throw new Error(
        'Database RLS policy is blocking delete. In Supabase SQL Editor, run: CREATE POLICY "Allow public delete on people" ON public.people FOR DELETE TO anon, authenticated USING (true);'
      );
    }
    throw new Error(`Delete failed: ${dbError.message}`);
  }
}

/**
 * Subscribes to Supabase Realtime changes on the `people` table.
 * Automatically triggers callback when new records are inserted by any visitor.
 */
export function subscribeToPeopleChanges(onChange: () => void): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel('realtime-people-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE_PEOPLE },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

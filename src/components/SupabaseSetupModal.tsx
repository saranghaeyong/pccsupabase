import React, { useState } from 'react';
import { Database, Check, Copy, X, ExternalLink, Terminal } from 'lucide-react';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConfigured: boolean;
  errorMessage?: string;
  onRetry: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
  isConfigured,
  errorMessage,
  onRetry
}) => {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedRlsFix, setCopiedRlsFix] = useState(false);

  if (!isOpen) return null;

  const envSnippet = `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-or-publishable-key`;

  const storageRlsSnippet = `-- FIX FOR: "Upload failed: new row violates row-level security policy"
-- 1. Ensure public bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('person-photos', 'person-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop any conflicting storage policies
DROP POLICY IF EXISTS "Allow public uploads to person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select on person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload to person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;

-- 3. Allow public reading & upload verification (INSERT ... RETURNING *)
CREATE POLICY "Allow public select on person-photos"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'person-photos');

-- 4. Allow anonymous & authenticated visitors to upload portrait photos
CREATE POLICY "Allow public uploads to person-photos"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'person-photos');

-- 5. Allow public updates if needed
CREATE POLICY "Allow public update on person-photos"
ON storage.objects FOR UPDATE TO anon, authenticated
USING (bucket_id = 'person-photos');

-- 6. Allow public delete on person-photos (removes storage image when card is deleted)
DROP POLICY IF EXISTS "Allow public delete on person-photos" ON storage.objects;
CREATE POLICY "Allow public delete on person-photos"
ON storage.objects FOR DELETE TO anon, authenticated
USING (bucket_id = 'person-photos');

-- 7. Allow public delete on people table
DROP POLICY IF EXISTS "Allow public delete on people" ON public.people;
CREATE POLICY "Allow public delete on people"
ON public.people FOR DELETE TO anon, authenticated
USING (true);`;

  const sqlSample = `-- Run in Supabase SQL Editor:
-- 1. Create people table
CREATE TABLE IF NOT EXISTS public.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 130),
    date_of_birth DATE NOT NULL,
    photo_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS) on people table
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.people;
DROP POLICY IF EXISTS "Allow public insert" ON public.people;
DROP POLICY IF EXISTS "Allow public delete on people" ON public.people;
CREATE POLICY "Allow public read access" ON public.people FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert" ON public.people FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public delete on people" ON public.people FOR DELETE TO anon, authenticated USING (true);

-- 3. Create public Storage bucket & RLS policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('person-photos', 'person-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public select on person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on person-photos" ON storage.objects;
CREATE POLICY "Allow public select on person-photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'person-photos');
CREATE POLICY "Allow public uploads to person-photos" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'person-photos');
CREATE POLICY "Allow public delete on person-photos" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'person-photos');`;

  const copyToClipboard = (text: string, type: 'env' | 'sql' | 'rls') => {
    navigator.clipboard.writeText(text);
    if (type === 'env') {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    } else if (type === 'sql') {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } else {
      setCopiedRlsFix(true);
      setTimeout(() => setCopiedRlsFix(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="supabase-setup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#EDE8E1] my-8 animate-in zoom-in-95 duration-200 space-y-6"
      >
        <button
          onClick={onClose}
          aria-label="Close setup modal"
          className="absolute top-4 right-4 text-[#8C847B] hover:text-[#1F2421] p-1.5 rounded-full hover:bg-[#FAF8F5] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center shrink-0 text-[#059669]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 id="supabase-setup-title" className="text-xl font-bold text-[#1F2421]">
              Supabase Configuration
            </h3>
            <p className="text-xs text-[#706A62] mt-0.5">
              Connect this app to your shared Supabase database and storage bucket.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E]">
            <strong>Notice:</strong> {errorMessage}
          </div>
        )}

        {/* Step 1: Env variables */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#1F2421]">
            <span>1. Set Environment Variables</span>
            <button
              onClick={() => copyToClipboard(envSnippet, 'env')}
              className="text-[#059669] hover:text-[#047857] flex items-center space-x-1"
            >
              {copiedEnv ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEnv ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 bg-[#1F2421] text-[#EAE4DC] text-xs font-mono rounded-xl overflow-x-auto">
            {envSnippet}
          </pre>
          <p className="text-[11px] text-[#8C847B]">
            Add these to your local <code className="bg-[#FAF8F5] px-1 py-0.5 rounded">.env</code> or Vercel Project Settings.
          </p>
        </div>

        {/* Step 2: SQL schema */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#1F2421]">
            <span>2. Full SQL Schema (Tables + Storage)</span>
            <button
              onClick={() => copyToClipboard(sqlSample, 'sql')}
              className="text-[#059669] hover:text-[#047857] flex items-center space-x-1 font-bold"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied!' : 'Copy Full SQL'}</span>
            </button>
          </div>
          <p className="text-[11px] text-[#706A62]">
            Execute the script in <code className="font-mono bg-[#FAF8F5] px-1 py-0.5 rounded">supabase/schema.sql</code> in your Supabase SQL Editor.
          </p>
        </div>

        {/* Step 3: Quick RLS Fix */}
        <div className="space-y-2 p-3.5 bg-[#FEF3C7]/40 border border-[#FDE68A] rounded-2xl">
          <div className="flex items-center justify-between text-xs font-semibold text-[#92400E]">
            <span className="flex items-center space-x-1.5">
              <Terminal className="w-4 h-4 text-[#D97706]" />
              <span>Fix "Upload failed: violates row-level security policy"</span>
            </span>
            <button
              onClick={() => copyToClipboard(storageRlsSnippet, 'rls')}
              className="text-[#B45309] hover:text-[#78350F] flex items-center space-x-1 bg-white px-2.5 py-1 rounded-lg border border-[#FDE68A] shadow-xs font-bold"
            >
              {copiedRlsFix ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRlsFix ? 'Copied Fix!' : 'Copy Fix SQL'}</span>
            </button>
          </div>
          <p className="text-[11px] text-[#78350F]">
            Supabase Storage requires public <code className="font-mono bg-white px-1 py-0.2 rounded">SELECT</code> and <code className="font-mono bg-white px-1 py-0.2 rounded">INSERT</code> policies on <code className="font-mono bg-white px-1 py-0.2 rounded">storage.objects</code> for the <code className="font-mono">person-photos</code> bucket. Copy this snippet and run it in the Supabase SQL Editor.
          </p>
        </div>

        <div className="pt-2 border-t border-[#EAE4DC] flex items-center justify-between">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#059669] hover:underline flex items-center space-x-1"
          >
            <span>Go to Supabase Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onRetry();
                onClose();
              }}
              className="px-4 py-2 bg-[#1F2421] text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors"
            >
              Test Connection
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D5CDC4] text-[#423E39] rounded-xl text-xs font-semibold hover:bg-[#FAF8F5] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { PersonFormData, ValidationErrors } from '../types';
import { calculateAgeFromDOB } from '../utils/dateAndAge';
import { ImageUploader } from '../components/ImageUploader';
import { ArrowLeft, CheckCircle2, Sparkles, PlusCircle, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface AddEditPersonPageProps {
  onSave: (formData: PersonFormData, onStepChange?: (step: 'validating' | 'uploading' | 'saving' | 'done') => void) => Promise<void>;
  onCancel: () => void;
}

export const AddEditPersonPage: React.FC<AddEditPersonPageProps> = ({
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<PersonFormData>({
    name: '',
    age: '',
    date_of_birth: '',
    photo_file: null,
    photo_preview: '',
    photo_url: ''
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<'idle' | 'validating' | 'uploading' | 'saving' | 'done'>('idle');
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [copiedRlsFix, setCopiedRlsFix] = useState(false);

  const storageRlsFixSql = `-- Run in Supabase SQL Editor:
INSERT INTO storage.buckets (id, name, public) VALUES ('person-photos', 'person-photos', true) ON CONFLICT (id) DO UPDATE SET public = true;
DROP POLICY IF EXISTS "Allow public select on person-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to person-photos" ON storage.objects;
CREATE POLICY "Allow public select on person-photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'person-photos');
CREATE POLICY "Allow public uploads to person-photos" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'person-photos');`;

  const copyRlsFix = () => {
    navigator.clipboard.writeText(storageRlsFixSql);
    setCopiedRlsFix(true);
    setTimeout(() => setCopiedRlsFix(false), 2000);
  };

  const handleDOBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDOB = e.target.value;
    const calculatedAge = newDOB ? calculateAgeFromDOB(newDOB) : '';

    setFormData((prev) => ({
      ...prev,
      date_of_birth: newDOB,
      age: calculatedAge !== '' ? calculatedAge : prev.age
    }));

    if (errors.date_of_birth) {
      setErrors((prev) => ({ ...prev, date_of_birth: undefined }));
    }
    if (errors.age && calculatedAge !== '') {
      setErrors((prev) => ({ ...prev, age: undefined }));
    }
  };

  const handleAutoCalculateAge = () => {
    if (formData.date_of_birth) {
      const calculated = calculateAgeFromDOB(formData.date_of_birth);
      setFormData((prev) => ({
        ...prev,
        age: calculated
      }));
      if (errors.age) {
        setErrors((prev) => ({ ...prev, age: undefined }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter person\'s name.';
    }

    if (formData.age === '' || formData.age === null || formData.age === undefined) {
      newErrors.age = 'Please enter age.';
    } else {
      const ageNum = Number(formData.age);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
        newErrors.age = 'Please enter a valid age between 0 and 130.';
      }
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Please enter date of birth.';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (formData.date_of_birth > today) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future.';
      }
    }

    if (!formData.photo_file && !formData.photo_url) {
      newErrors.photo = 'Please upload a photo for the person card.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStep('validating');
    setSuccessFeedback(null);

    try {
      await onSave(formData, (step) => {
        setSubmitStep(step);
      });

      // Reset form after successful card creation
      setFormData({
        name: '',
        age: '',
        date_of_birth: '',
        photo_file: null,
        photo_preview: '',
        photo_url: ''
      });

      setSuccessFeedback('Person card created and saved to shared database!');
      setSubmitStep('done');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while creating card.';
      setErrors((prev) => ({ ...prev, general: message }));
      setSubmitStep('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonText = () => {
    if (!isSubmitting) return 'Create Card';
    switch (submitStep) {
      case 'uploading':
        return 'Uploading Photo...';
      case 'saving':
        return 'Saving to Database...';
      case 'done':
        return 'Successfully Added!';
      default:
        return 'Creating Card...';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header with Back button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#706A62] hover:text-[#1F2421] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Collection</span>
        </button>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#EAE4DC] text-[#423E39]">
          Public Card Creator
        </span>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EDE8E1] shadow-lg space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#1F2421] font-display">
            Add Person
          </h2>
          <p className="mt-1 text-sm text-[#706A62]">
            Upload a portrait photo and enter details to publish a new card to the shared database.
          </p>
        </div>

        {/* Success Alert */}
        {successFeedback && (
          <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl flex items-center space-x-2.5 text-[#065F46] text-sm animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
            <div className="flex-grow">
              <p className="font-bold">{successFeedback}</p>
              <p className="text-xs text-[#065F46]/80 mt-0.5">
                The new card is now visible to all visitors in the collection.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-semibold underline text-[#065F46] hover:text-[#044e39] ml-2"
            >
              View collection
            </button>
          </div>
        )}

        {/* General Form Error / Database Error */}
        {errors.general && (
          <div className="p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-2xl text-sm text-[#B91C1C] space-y-3">
            <div>
              <p className="font-semibold">Unable to create card</p>
              <p className="text-xs text-[#B91C1C]/90 mt-1">{errors.general}</p>
            </div>

            {(errors.general.toLowerCase().includes('row-level security') ||
              errors.general.toLowerCase().includes('violates')) && (
              <div className="pt-2 border-t border-[#FECACA] space-y-2 text-xs">
                <p className="text-[#991B1B] font-medium">
                  Supabase RLS is blocking this operation. You can fix this by running the SQL policy snippet in your Supabase SQL Editor:
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={copyRlsFix}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#991B1B] text-white rounded-lg text-xs font-bold hover:bg-[#7F1D1D] transition-colors"
                  >
                    {copiedRlsFix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRlsFix ? 'SQL Copied!' : 'Copy Storage Fix SQL'}</span>
                  </button>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 border border-[#FECACA] bg-white text-[#991B1B] rounded-lg text-xs font-medium hover:bg-[#FFF5F5] transition-colors"
                  >
                    <span>Supabase Dashboard</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload Field */}
          <ImageUploader
            currentPhotoUrl={formData.photo_preview || formData.photo_url}
            onImageSelected={(file, previewUrl) => {
              setFormData((prev) => ({
                ...prev,
                photo_file: file,
                photo_preview: previewUrl
              }));
              if (errors.photo) {
                setErrors((prev) => ({ ...prev, photo: undefined }));
              }
            }}
            onImageRemoved={() => {
              setFormData((prev) => ({
                ...prev,
                photo_file: null,
                photo_preview: '',
                photo_url: ''
              }));
            }}
            isUploading={isSubmitting && submitStep === 'uploading'}
            uploadProgressText="Uploading to Supabase Storage..."
            error={errors.photo}
          />

          {/* Name Field */}
          <div>
            <label htmlFor="person-name-input" className="block text-sm font-semibold text-[#1F2421] mb-1.5">
              Name <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              id="person-name-input"
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder="e.g. Alex Morgan"
              className="w-full px-4 py-3 bg-[#FAF8F5] text-[#1F2421] placeholder-[#9E968D] rounded-xl border border-[#D5CDC4] focus:outline-none focus:border-[#1F2421] focus:ring-1 focus:ring-[#1F2421] text-sm sm:text-base transition-colors"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-[#B91C1C]">{errors.name}</p>
            )}
          </div>

          {/* Grid of DOB and Age */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date of Birth Field */}
            <div>
              <label htmlFor="person-dob-input" className="block text-sm font-semibold text-[#1F2421] mb-1.5">
                Date of Birth <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="person-dob-input"
                type="date"
                value={formData.date_of_birth}
                onChange={handleDOBChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-[#FAF8F5] text-[#1F2421] rounded-xl border border-[#D5CDC4] focus:outline-none focus:border-[#1F2421] focus:ring-1 focus:ring-[#1F2421] text-sm sm:text-base transition-colors"
              />
              {errors.date_of_birth && (
                <p className="mt-1 text-xs text-[#B91C1C]">{errors.date_of_birth}</p>
              )}
            </div>

            {/* Age Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="person-age-input" className="block text-sm font-semibold text-[#1F2421]">
                  Age <span className="text-[#B91C1C]">*</span>
                </label>
                {formData.date_of_birth && (
                  <button
                    type="button"
                    onClick={handleAutoCalculateAge}
                    className="text-[11px] text-[#529E72] hover:text-[#387652] font-semibold flex items-center space-x-1"
                    title="Calculate age from selected Date of Birth"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-calc age</span>
                  </button>
                )}
              </div>
              <input
                id="person-age-input"
                type="number"
                min="0"
                max="130"
                value={formData.age}
                onChange={(e) => {
                  setFormData({ ...formData, age: e.target.value });
                  if (errors.age) setErrors({ ...errors, age: undefined });
                }}
                placeholder="e.g. 24"
                className="w-full px-4 py-3 bg-[#FAF8F5] text-[#1F2421] placeholder-[#9E968D] rounded-xl border border-[#D5CDC4] focus:outline-none focus:border-[#1F2421] focus:ring-1 focus:ring-[#1F2421] text-sm sm:text-base transition-colors"
              />
              {errors.age && (
                <p className="mt-1 text-xs text-[#B91C1C]">{errors.age}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#EAE4DC] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-[#D5CDC4] text-sm font-semibold text-[#5C5650] hover:bg-[#F4EFEB] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              id="create-card-btn"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#1F2421] hover:bg-[#000000] text-white rounded-xl text-sm font-semibold transition-colors shadow-xs flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{getButtonText()}</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Card</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

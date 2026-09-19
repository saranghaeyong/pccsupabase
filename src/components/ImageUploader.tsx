import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Upload, X, RefreshCw, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { validateImageFile, optimizeImageForUpload, OptimizedImage } from '../utils/imageOptimizer';

interface ImageUploaderProps {
  currentPhotoUrl?: string;
  onImageSelected: (file: File, previewUrl: string) => void;
  onImageRemoved: () => void;
  isUploading?: boolean;
  uploadProgressText?: string;
  error?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentPhotoUrl,
  onImageSelected,
  onImageRemoved,
  isUploading = false,
  uploadProgressText,
  error
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimizedData, setOptimizedData] = useState<OptimizedImage | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setLocalError(null);
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setLocalError(validation.error || 'Invalid image file.');
      return;
    }

    setIsProcessing(true);
    try {
      // Validate, scale & optimize client-side before uploading to Supabase
      const result = await optimizeImageForUpload(file);
      setOptimizedData(result);
      onImageSelected(result.file, result.previewUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error processing image';
      setLocalError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setOptimizedData(null);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemoved();
  };

  const previewSource = optimizedData?.previewUrl || currentPhotoUrl;

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-[#1F2421] mb-1.5">
        Photo <span className="text-[#B91C1C]">*</span>
      </label>

      {previewSource ? (
        /* Image Preview Box */
        <div className="relative bg-[#F4EFEB] rounded-2xl p-4 border border-[#E8E2DA] flex flex-col sm:flex-row items-center gap-4 animate-in fade-in duration-200">
          <div className="relative w-32 aspect-[4/5] rounded-xl overflow-hidden bg-[#E2DBD1] shadow-xs shrink-0">
            <img
              src={previewSource}
              alt="Person portrait preview"
              className="w-full h-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2 text-center">
                <RefreshCw className="w-6 h-6 animate-spin mb-1 text-white" />
                <span className="text-[10px] font-medium tracking-wide">Uploading...</span>
              </div>
            )}
          </div>

          <div className="flex-grow space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-xs text-[#529E72] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Portrait ready for upload</span>
            </div>

            {optimizedData && (
              <p className="text-xs text-[#706A62]">
                Optimized file: {(optimizedData.optimizedSize / 1024).toFixed(0)} KB
                {optimizedData.originalSize > optimizedData.optimizedSize && (
                  <span className="text-[#529E72] ml-1">
                    ({Math.round((1 - optimizedData.optimizedSize / optimizedData.originalSize) * 100)}% smaller)
                  </span>
                )}
              </p>
            )}

            <p className="text-xs text-[#8C847B]">
              Will be saved to Supabase Storage (<code className="bg-[#EAE4DC] px-1 py-0.5 rounded text-[11px]">person-photos</code>)
            </p>

            {/* Change / Remove buttons */}
            {!isUploading && (
              <div className="flex items-center justify-center sm:justify-start space-x-2 pt-1.5">
                <button
                  type="button"
                  id="replace-photo-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-medium bg-white text-[#1F2421] rounded-lg border border-[#D5CDC4] hover:bg-[#FAF8F5] transition-colors flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#706A62]" />
                  <span>Change Photo</span>
                </button>

                <button
                  type="button"
                  id="remove-photo-btn"
                  onClick={handleRemove}
                  className="px-3 py-1.5 text-xs font-medium text-[#B91C1C] hover:bg-[#FEE2E2]/60 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            )}

            {isUploading && uploadProgressText && (
              <div className="text-xs font-medium text-[#1F2421] animate-pulse">
                {uploadProgressText}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          id="photo-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-[#1F2421] bg-[#F2EDE6]'
              : 'border-[#DCD4C8] hover:border-[#8C847B] bg-[#FFFFFF]'
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center space-y-2 py-4">
              <RefreshCw className="w-8 h-8 text-[#1F2421] animate-spin" />
              <p className="text-xs font-medium text-[#706A62]">Optimizing portrait...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#EAE4DC] flex items-center justify-center mb-3 text-[#706A62]">
                <Upload className="w-6 h-6" />
              </div>

              <p className="text-sm font-semibold text-[#1F2421] mb-1">
                Click to upload or drag & drop photo
              </p>
              <p className="text-xs text-[#8C847B] mb-2">
                Supported: JPG, JPEG, PNG, WEBP (up to 10MB)
              </p>
              <span className="inline-flex items-center text-[11px] font-medium text-[#706A62] bg-[#F4EFEB] px-2.5 py-0.5 rounded-full">
                <ImageIcon className="w-3 h-3 mr-1" />
                Auto-optimized portrait format
              </span>
            </>
          )}
        </div>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        id="photo-file-input"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* Validation Errors */}
      {(localError || error) && (
        <p className="mt-1.5 text-xs text-[#B91C1C] flex items-center space-x-1">
          <span>{localError || error}</span>
        </p>
      )}
    </div>
  );
};

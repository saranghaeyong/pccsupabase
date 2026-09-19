import React, { useEffect, useState } from 'react';
import { Person } from '../types';
import { formatDisplayDate } from '../utils/dateAndAge';
import { ArrowLeft, Calendar, User, X, Database, Trash2, Loader2 } from 'lucide-react';

interface PersonDetailModalProps {
  person: Person | null;
  onClose: () => void;
  onDelete?: (personId: string, photoUrl?: string) => Promise<void>;
}

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  person,
  onClose,
  onDelete
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Reset confirmation state when person changes
    setIsConfirmingDelete(false);
    setIsDeleting(false);
  }, [person]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && person && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [person, onClose, isDeleting]);

  if (!person) return null;

  const displayDOB = person.date_of_birth || person.dateOfBirth || '';
  const displayImage = person.photo_url || person.image || '';
  const formattedDOB = formatDisplayDate(displayDOB);

  const handleDelete = async () => {
    if (!person || !onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(person.id, displayImage);
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-detail-name"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#EDE8E1] my-8 animate-in zoom-in-95 duration-200"
      >
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          aria-label="Close details"
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/85 hover:bg-white text-[#2D2A26] rounded-full backdrop-blur-md flex items-center justify-center shadow-xs transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Container */}
        <div className="flex flex-col md:flex-row">
          {/* Portrait Image Section (4:5 Portrait) */}
          <div className="md:w-1/2 bg-[#F4EFEB] relative overflow-hidden aspect-[4/5] md:aspect-auto">
            {displayImage ? (
              <img
                src={displayImage}
                alt={`Portrait of ${person.name}`}
                className="w-full h-full object-cover min-h-[300px] md:min-h-[440px]"
              />
            ) : (
              <div className="w-full h-full min-h-[300px] flex items-center justify-center text-[#8C847B]">
                <User className="w-16 h-16 opacity-40" />
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Back Link */}
              <button
                type="button"
                id="modal-back-btn"
                onClick={onClose}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#706A62] hover:text-[#1F2421] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Collection</span>
              </button>

              {/* Person Name */}
              <div>
                <span className="text-[11px] font-semibold text-[#8C847B] uppercase tracking-wider">
                  Person Profile
                </span>
                <h2
                  id="person-detail-name"
                  className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-[#1F2421] mt-0.5"
                >
                  {person.name}
                </h2>
              </div>

              {/* Data List */}
              <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#EAE4DC] space-y-3">
                <div className="flex items-center justify-between py-1 border-b border-[#EAE4DC]/60">
                  <div className="flex items-center space-x-2 text-sm text-[#706A62]">
                    <User className="w-4 h-4 text-[#8C847B]" />
                    <span className="font-medium">Age</span>
                  </div>
                  <span className="text-base font-bold text-[#1F2421]">{person.age}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2 text-sm text-[#706A62]">
                    <Calendar className="w-4 h-4 text-[#8C847B]" />
                    <span className="font-medium">Date of Birth</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1F2421] text-right">{formattedDOB}</span>
                </div>
              </div>

              {/* Database sync badge */}
              <div className="flex items-center space-x-2 text-[11px] text-[#706A62] bg-[#F4EFEB] px-3 py-2 rounded-xl">
                <Database className="w-4 h-4 text-[#3ECF8E] shrink-0" />
                <span>Stored in shared Supabase database</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#EAE4DC]">
              {!isConfirmingDelete ? (
                <div className="flex items-center justify-between">
                  {onDelete ? (
                    <button
                      type="button"
                      id="person-detail-delete-btn"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-[#FEE2E2]/70 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Card</span>
                    </button>
                  ) : (
                    <div />
                  )}
                  <button
                    type="button"
                    id="person-detail-back-action-btn"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-[#1F2421] text-white hover:bg-black text-xs font-semibold shadow-xs transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-3 bg-[#FEF2F2] border border-[#FECACA] p-3.5 rounded-2xl animate-in fade-in duration-150">
                  <div className="text-xs text-[#991B1B]">
                    <p className="font-bold">Delete this person card?</p>
                    <p className="mt-0.5 text-[11px] text-[#B91C1C]">
                      This will remove the portrait from storage and delete the database record.
                    </p>
                  </div>
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      disabled={isDeleting}
                      className="px-3 py-1.5 rounded-xl border border-[#D9D3CA] text-xs font-semibold text-[#5A544C] bg-white hover:bg-[#FAF8F5] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      id="person-detail-confirm-delete-btn"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Confirm Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

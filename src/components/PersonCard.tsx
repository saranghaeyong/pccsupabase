import React, { useState } from 'react';
import { Person } from '../types';
import { formatDisplayDate } from '../utils/dateAndAge';
import { Calendar, User, Trash2 } from 'lucide-react';

interface PersonCardProps {
  person: Person;
  onClick: (person: Person) => void;
  onDelete?: (person: Person) => void;
}

export const PersonCard: React.FC<PersonCardProps> = ({ person, onClick, onDelete }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const displayDOB = person.date_of_birth || person.dateOfBirth || '';
  const displayImage = person.photo_url || person.image || '';
  const formattedDOB = formatDisplayDate(displayDOB);

  return (
    <article
      id={`person-card-${person.id}`}
      onClick={() => onClick(person)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(person);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${person.name}, Age ${person.age}`}
      className="group relative bg-[#FFFFFF] rounded-2xl p-3 border border-[#EDE8E1] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F2421] flex flex-col justify-between overflow-hidden"
    >
      {/* 4:5 Aspect Ratio Photo Container */}
      <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-[#F4EFEB] mb-3">
        {/* Placeholder skeleton while loading */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-[#EFE9E2] animate-pulse flex items-center justify-center">
            <User className="w-10 h-10 text-[#C7BEB4] opacity-50" />
          </div>
        )}

        {/* Fallback image if error */}
        {imageError || !displayImage ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#8C847B] p-4 text-center bg-[#F2EDE6]">
            <User className="w-12 h-12 mb-2 text-[#ABA195]" />
            <span className="text-xs font-medium line-clamp-1">{person.name}</span>
          </div>
        ) : (
          <img
            src={displayImage}
            alt={`Photo of ${person.name}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Delete button top left */}
        {onDelete && (
          <button
            type="button"
            aria-label={`Delete ${person.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(person);
            }}
            className="absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-[#FEE2E2] text-[#706A62] hover:text-[#DC2626] backdrop-blur-md flex items-center justify-center shadow-xs sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Age pill top right */}
        <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-[#1F2421] shadow-xs">
          Age: {person.age}
        </div>
      </div>

      {/* Card Info */}
      <div className="px-1.5 pb-1 flex flex-col flex-grow justify-between">
        {/* Person Name */}
        <h3 className="text-[15px] sm:text-[16px] font-bold tracking-wide uppercase text-[#1F2421] line-clamp-1 group-hover:text-[#000000] transition-colors">
          {person.name}
        </h3>

        {/* Age & Date of Birth Information */}
        <div className="mt-2 space-y-1 text-xs text-[#6B655E]">
          <div className="flex items-center space-x-1.5">
            <span className="font-medium text-[#423E39]">Age:</span>
            <span>{person.age}</span>
          </div>

          <div className="flex items-center space-x-1.5 pt-0.5">
            <Calendar className="w-3.5 h-3.5 text-[#9E968D] shrink-0" />
            <span className="font-medium text-[#423E39]">DOB:</span>
            <span className="truncate">{formattedDOB}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

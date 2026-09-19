import React from 'react';
import { Person } from '../types';
import { PersonCard } from './PersonCard';

interface PersonGridProps {
  people: Person[];
  onCardClick: (person: Person) => void;
  onDeletePerson?: (person: Person) => void;
}

export const PersonGrid: React.FC<PersonGridProps> = ({
  people,
  onCardClick,
  onDeletePerson
}) => {
  return (
    <div
      id="person-collection-grid"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 w-full"
    >
      {people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          onClick={onCardClick}
          onDelete={onDeletePerson}
        />
      ))}
    </div>
  );
};

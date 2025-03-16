"use client";

import React, { useState, useEffect } from 'react';
import { allNotes } from '@/lib/utils';


// Define types for available notes function
interface AvailableNotesParams {
  allNotes: string[];
  range: [string, string];
  notes: string[];
  keyId: string;
}

// Import the availableNotes function from generators
import { availableNotes } from '@/lib/generators';

interface NoteSequencerProps {
  keyId?: string;
  notes: string[];
  range: [string, string];
  numberOfNotes: number;
  onSequenceGenerated?: (sequence: string[]) => void;
}

const NoteSequencer: React.FC<NoteSequencerProps> = ({
  notes,
  range,
  numberOfNotes,
  onSequenceGenerated
}) => {
  const [sequence, setSequence] = useState<string[]>([]);

  useEffect(() => {
    generateSequence();
  }, [notes, range, numberOfNotes]);

  const generateSequence = () => {
    const available = availableNotes({
      allNotes,
      range,
      notes,
      keyId: '' 
    });

    if (available.length === 0) {
      setSequence([]);
      if (onSequenceGenerated) {
        onSequenceGenerated([]);
      }
      return;
    }

    
    const newSequence: string[] = [];
    
    for (let i = 0; i < numberOfNotes; i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      newSequence.push(available[randomIndex]);
    }

    setSequence(newSequence);
    if (onSequenceGenerated) {
      onSequenceGenerated(newSequence);
    }
  };

 
  return (
    <>
      {sequence.map((note, index) => (
        <span key={index} className="text-sm font-mono">
          {note}{index < sequence.length - 1 ? ' → ' : ''}
        </span>
      ))}
    </>
  );
};

export default NoteSequencer;
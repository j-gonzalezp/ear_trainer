"use client";

import React, { useState, useEffect } from 'react';
import * as Tone from 'tone';

interface PianoProps {
  onKeyPress: (note: string) => void;
  highlightedNotes?: string[];
  keyboardMode?: boolean;
  startNote?: string;
  endNote?: string;
}

const Piano: React.FC<PianoProps> = ({ 
  onKeyPress, 
  highlightedNotes = [], 
  keyboardMode = false,
  startNote = "C4",
  endNote = "B5"
}) => {
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({});
  
  // Define all notes in a chromatic scale
  const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  
  // Map for computer keyboard to piano keys (when keyboardMode is true)
  const keyboardMap: Record<string, string> = {
    'a': 'C4', 'w': 'C#4', 's': 'D4', 'e': 'D#4', 'd': 'E4', 'f': 'F4', 
    't': 'F#4', 'g': 'G4', 'y': 'G#4', 'h': 'A4', 'u': 'A#4', 'j': 'B4',
    'k': 'C5', 'o': 'C#5', 'l': 'D5', 'p': 'D#5', ';': 'E5', '\'': 'F5',
  };
  
  // Generate the piano notes range
  const getNoteRange = () => {
    const startOctave = parseInt(startNote.slice(-1));
    const endOctave = parseInt(endNote.slice(-1));
    const startIndex = allNotes.indexOf(startNote.slice(0, -1));
    const endIndex = allNotes.indexOf(endNote.slice(0, -1));
    
    if (startIndex === -1 || endIndex === -1) {
      return [];
    }
    
    const notes: string[] = [];
    
    for (let octave = startOctave; octave <= endOctave; octave++) {
      for (let i = 0; i < allNotes.length; i++) {
        const note = `${allNotes[i]}${octave}`;
        
        if (octave === startOctave && i < startIndex) {
          continue;
        }
        
        if (octave === endOctave && i > endIndex) {
          break;
        }
        
        notes.push(note);
      }
    }
    
    return notes;
  };
  
  const pianoNotes = getNoteRange();
  
  useEffect(() => {
    if (!keyboardMode) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keyboardMap[key] && !activeKeys[key]) {
        setActiveKeys(prev => ({ ...prev, [key]: true }));
        onKeyPress(keyboardMap[key]);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keyboardMap[key]) {
        setActiveKeys(prev => ({ ...prev, [key]: false }));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyboardMode, activeKeys, onKeyPress]);
  
  const isBlackKey = (note: string) => {
    return note.includes('#');
  };
  
  const isHighlighted = (note: string) => {
    return highlightedNotes.some(highlightedNote => {
      // Extract the note name without octave for comparison
      const noteName = note.replace(/\d+$/, '');
      const highlightedNoteName = highlightedNote.replace(/\d+$/, '');
      return noteName === highlightedNoteName;
    });
  };
  
  const getKeyboardKey = (note: string) => {
    for (const [key, value] of Object.entries(keyboardMap)) {
      if (value === note) {
        return key;
      }
    }
    return null;
  };
  
  const handlePianoKeyPress = (note: string) => {
    onKeyPress(note);
  };

  return (
    <div className="relative">
      <div className="flex">
        {pianoNotes.map((note, index) => {
          const isBlack = isBlackKey(note);
          const highlighted = isHighlighted(note);
          const keyboardKey = keyboardMode ? getKeyboardKey(note) : null;
          
          return (
            <div
              key={note}
              className={`
                ${isBlack ? 'h-28 w-6 bg-black text-white -mx-3 z-10 relative' : 'h-40 w-10 bg-white text-black border border-gray-300'}
                ${highlighted ? isBlack ? 'bg-blue-800' : 'bg-blue-300' : ''}
                ${keyboardMode && keyboardKey && activeKeys[keyboardKey] ? 'opacity-70' : ''}
                flex flex-col items-center justify-end pb-2 cursor-pointer
              `}
              onClick={() => handlePianoKeyPress(note)}
            >
              <div className="text-xs">
                {note.replace(/\d+$/, '')}
              </div>
              {keyboardMode && keyboardKey && (
                <div className="text-xs mt-1">
                  {keyboardKey}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Piano;
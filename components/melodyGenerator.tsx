"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { availableNotes } from '@/lib/generators';
import { rhythmGenerator } from '@/lib/generators';

interface MelodyGeneratorProps {
  keyId: string;
  musicalKey: string;
  notes: string[];
  range: [string, string];
  bpm: number;
  loop: boolean;
  rhythm: boolean;
  numberOfNotes: number;
  generatedSequence: string[];
  setGeneratedSequence: (sequence: string[]) => void;
  allNotes: string[];
}

interface RhythmItem {
  type: "note" | "rest";
  duration: string;
  value: number;
}

interface SequenceNote {
  note: string;
  duration: string;
  type: "note" | "rest";
}

const MelodyGenerator: React.FC<MelodyGeneratorProps> = ({
  keyId,
  musicalKey,
  notes,
  range,
  bpm,
  loop,
  rhythm,
  numberOfNotes,
  generatedSequence,
  setGeneratedSequence,
  allNotes
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentNote, setCurrentNote] = useState<number>(0);
  const synthRef = useRef<Tone.Synth | null>(null);
  const metronomeRef = useRef<Tone.MembraneSynth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const loopCountRef = useRef<number>(0);

  
  
  useEffect(() => {
    synthRef.current = new Tone.Synth().toDestination();
    metronomeRef.current = new Tone.MembraneSynth({
      volume: -10
    }).toDestination();
    
    Tone.Transport.bpm.value = bpm * 2;
    
    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (metronomeRef.current) {
        metronomeRef.current.dispose();
      }
    };
  }, [bpm]);

  
  const generateNewSequence = (): { notes: string[], fullSequence: SequenceNote[] } => {
   
    const availableNotesArr = availableNotes({
      allNotes,
      range,
      notes,
      keyId: musicalKey 
    });

    if (availableNotesArr.length === 0) {
      console.error('No available notes with the current settings');
      return { notes: [], fullSequence: [] };
    }

    
    const sequence: string[] = [];
    for (let i = 0; i < numberOfNotes; i++) {
      const randomIndex = Math.floor(Math.random() * availableNotesArr.length);
      sequence.push(availableNotesArr[randomIndex]);
    }

    
    let rhythmSequence: RhythmItem[] = [];
    if (rhythm) {
      rhythmSequence = rhythmGenerator({
        totalBeats: 8,
        shortestDuration: "8n",
        longestDuration: "2n",
        n: numberOfNotes,
        allowRests: true,
        restProbability: 0.2
      }) as RhythmItem[]; 
    } else {
      
      rhythmSequence = Array(numberOfNotes).fill(null).map(() => ({ 
        type: "note" as "note", 
        duration: "4n", 
        value: 1 
      }));
    }

    
    const finalSequence: SequenceNote[] = [];
    let noteIndex = 0;
    
    for (const rhythmItem of rhythmSequence) {
      if (rhythmItem.type === "note") {
        if (noteIndex < sequence.length) {
          finalSequence.push({
            note: sequence[noteIndex],
            duration: rhythmItem.duration,
            type: "note"
          });
          noteIndex++;
        }
      } else {
        finalSequence.push({
          note: "",
          duration: rhythmItem.duration,
          type: "rest"
        });
      }
    }

    
    setGeneratedSequence(sequence);
    
    return { notes: sequence, fullSequence: finalSequence };
  };

  
  const playSequence = (sequence: { notes: string[], fullSequence: SequenceNote[] }): void => {
    if (!sequence || sequence.fullSequence.length === 0) return;
    
    
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
    }
    
    
    loopCountRef.current = 0;
    
    let index = 0;
    sequenceRef.current = new Tone.Sequence(
      (time, value) => {
       
        if (index === 0 && loop) {
          if (loopCountRef.current > 0 && metronomeRef.current) {
            metronomeRef.current.triggerAttackRelease("C2", "16n", time);
          }
          loopCountRef.current++;
        }
        
        if (value && value.type === "note" && synthRef.current) {
          synthRef.current.triggerAttackRelease(value.note, value.duration, time);
          setCurrentNote(index);
        }
        
        index++;
        
        
        if (index >= sequence.fullSequence.length && !loop) {
          
          Tone.Transport.scheduleOnce(() => {
            stopPlaying();
          }, "+0.1");
          return;
        }
        
        index = index % sequence.fullSequence.length;
      },
      sequence.fullSequence.map(item => item.type === "rest" ? null : item),
      "4n"
    );
    
    sequenceRef.current.loop = loop;
    sequenceRef.current.start(0);
    
   
    if (Tone.Transport.state !== "started") {
      Tone.Transport.start();
    }
  };

  
  const stopPlaying = (): void => {
    if (sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    Tone.Transport.stop();
    setIsPlaying(false);
    setCurrentNote(0);
  };

  
  const handlePlayClick = async (): Promise<void> => {
    
    if (Tone.context.state !== "running") {
      await Tone.start();
    }
    
    if (isPlaying) {
      stopPlaying();
    } else {
      setIsPlaying(true);
      const sequence = generateNewSequence();
      playSequence(sequence);
    }
  };

  
  const handleGenerateClick = (): void => {
    stopPlaying();
    generateNewSequence();
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Generador de Melodía</h2>
      
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-2">
          {generatedSequence.map((note, index) => (
            <div 
              key={index} 
              className={`px-3 py-1 rounded ${currentNote === index && isPlaying ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {note}
            </div>
          ))}
        </div>
        
        {generatedSequence.length === 0 && (
          <p className="text-gray-500">No se ha generado melodía. Haz clic en "Generar" para crear una.</p>
        )}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handlePlayClick}
          className={`px-4 py-2 rounded ${isPlaying ? 'bg-red-500' : 'bg-green-500'} text-white`}
        >
          {isPlaying ? 'Detener' : 'Reproducir'}
        </button>
        
        <button
          onClick={handleGenerateClick}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Generar
        </button>
      </div>
    </div>
  );
};

export default MelodyGenerator;
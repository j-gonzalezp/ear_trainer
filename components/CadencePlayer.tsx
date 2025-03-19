"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Button } from "@/components/ui/button";
import Piano from './Piano';

interface CadencePlayerProps {
  musicalKey: string;
  bpm?: number;
  onCadenceComplete?: () => void;
}

const CadencePlayer: React.FC<CadencePlayerProps> = ({
  musicalKey,
  bpm = 120,
  onCadenceComplete
}) => {
  const [isPlayingCadence, setIsPlayingCadence] = useState<boolean>(false);
  const pianoRef = useRef<Tone.Sampler | null>(null);
  const cadenceRef = useRef<Tone.Part | null>(null);

  useEffect(() => {
    const setupAudio = async () => {
      if (typeof window !== 'undefined') {
        pianoRef.current = new Tone.Sampler({
          urls: {
            A0: 'A0.mp3',
            C1: 'C1.mp3',
            'D#1': 'Ds1.mp3',
            'F#1': 'Fs1.mp3',
            A1: 'A1.mp3',
            C2: 'C2.mp3',
            'D#2': 'Ds2.mp3',
            'F#2': 'Fs2.mp3',
            A2: 'A2.mp3',
            C3: 'C3.mp3',
            'D#3': 'Ds3.mp3',
            'F#3': 'Fs3.mp3',
            A3: 'A3.mp3',
            C4: 'C4.mp3',
            'D#4': 'Ds4.mp3',
            'F#4': 'Fs4.mp3',
            A4: 'A4.mp3',
            C5: 'C5.mp3',
            'D#5': 'Ds5.mp3',
            'F#5': 'Fs5.mp3',
            A5: 'A5.mp3',
            C6: 'C6.mp3',
            'D#6': 'Ds6.mp3',
            'F#6': 'Fs6.mp3',
            A6: 'A6.mp3',
            C7: 'C7.mp3',
            'D#7': 'Ds7.mp3',
            'F#7': 'Fs7.mp3',
            A7: 'A7.mp3',
            C8: 'C8.mp3',
          },
          baseUrl: 'https://tonejs.github.io/audio/salamander/',
          onload: () => console.log("Piano samples loaded"),
          onerror: (err) => console.error("Error loading piano samples:", err)
        }).toDestination();
    
        Tone.Transport.bpm.value = bpm * 2;
      }
    };
    
    setupAudio();

    return () => {
      if (cadenceRef.current) {
        cadenceRef.current.dispose();
      }
      if (pianoRef.current) {
        pianoRef.current.dispose();
      }
    };
  }, [bpm]);

  const getCadenceChords = () => {
    if (!musicalKey) return [];
    
    const chromaticNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const keyIndex = chromaticNotes.indexOf(musicalKey);
    if (keyIndex === -1) return [];
    
    const tonic = musicalKey + "4";
    
    const subdominantIndex = (keyIndex + 5) % 12;
    const subdominant = chromaticNotes[subdominantIndex] + "4";
    
    const dominantIndex = (keyIndex + 7) % 12;
    const dominant = chromaticNotes[dominantIndex] + "4";
    
    return [
      [tonic, getNoteAtInterval(tonic, 4), getNoteAtInterval(tonic, 7)],
      [subdominant, getNoteAtInterval(subdominant, 4), getNoteAtInterval(subdominant, 7)],
      [dominant, getNoteAtInterval(dominant, 4), getNoteAtInterval(dominant, 7)],
      [tonic, getNoteAtInterval(tonic, 4), getNoteAtInterval(tonic, 7)]
    ];
  };
  
  const getNoteAtInterval = (baseNote: string, semitones: number) => {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const noteName = baseNote.replace(/\d+$/, '');
    const octave = parseInt(baseNote.match(/\d+$/)?.[0] || "4");
    
    let noteIndex = notes.indexOf(noteName);
    if (noteIndex === -1) return baseNote;
    
    noteIndex += semitones;
    const octaveShift = Math.floor(noteIndex / 12);
    noteIndex = noteIndex % 12;
    
    return notes[noteIndex] + (octave + octaveShift);
  };
  
  const playCadence = async () => {
    if (Tone.context.state !== "running") {
      await Tone.start();
    }
  
    if (isPlayingCadence) {
      stopCadence();
      return;
    }
  
    setIsPlayingCadence(true);
  
    const chords = getCadenceChords();
    if (chords.length === 0 || !pianoRef.current) {
      setIsPlayingCadence(false);
      return;
    }
  
    if (cadenceRef.current) {
      cadenceRef.current.dispose();
    }
  
    let chordIndex = 0;
  
    cadenceRef.current = new Tone.Part((time, chord) => {
      if (chord && pianoRef.current) {
        pianoRef.current.triggerAttackRelease(chord, "2n", time);
      }
  
      chordIndex++;
  
      if (chordIndex >= chords.length) {
        Tone.Transport.scheduleOnce(() => {
          stopCadence();
          if (onCadenceComplete) {
            onCadenceComplete();
          }
        }, `+2n`);
      }
    }, chords.map((chord, i) => [i * Tone.Time("2n").toSeconds(), chord]));
  
    cadenceRef.current.start(0);
  
    if (Tone.Transport.state !== "started") {
      Tone.Transport.start();
    }
  };

  const stopCadence = () => {
    if (cadenceRef.current) {
      cadenceRef.current.stop();
      cadenceRef.current.dispose();
      cadenceRef.current = null;
    }
    
    Tone.Transport.stop();
    setIsPlayingCadence(false);
  };

  return (
    <div>
      <Button 
        onClick={playCadence}
        variant={isPlayingCadence ? "destructive" : "secondary"}
      >
        {isPlayingCadence ? 'Stop Cadence' : 'Play Cadence'}
      </Button>
    </div>
  );
};

export default CadencePlayer;
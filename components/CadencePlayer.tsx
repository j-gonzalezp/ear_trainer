"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { Button } from "@/components/ui/button";

interface CadencePlayerProps {
  musicalKey: string;
  bpm?: number;
  onCadenceComplete?: () => void;
  pianoInstrument?: Tone.Sampler;
  autoPlay?: boolean;
}

const CadencePlayer: React.FC<CadencePlayerProps> = ({
  musicalKey,
  bpm = 120,
  onCadenceComplete,
  pianoInstrument = null,
  autoPlay = false
}) => {
  const [isPlayingCadence, setIsPlayingCadence] = useState<boolean>(false);
  const pianoRef = useRef<Tone.Sampler | null>(null);
  const cadenceRef = useRef<Tone.Part | null>(null);

  const getNoteAtInterval = useCallback((baseNote: string, semitones: number) => {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const noteName = baseNote.replace(/\d+$/, '');
    const octave = parseInt(baseNote.match(/\d+$/)?.[0] || "4");
    
    let noteIndex = notes.indexOf(noteName);
    if (noteIndex === -1) return baseNote;
    
    noteIndex += semitones;
    const octaveShift = Math.floor(noteIndex / 12);
    noteIndex = noteIndex % 12;
    
    return notes[noteIndex] + (octave + octaveShift);
  }, []);

  const getCadenceChords = useCallback(() => {
    if (!musicalKey) return [];
    
    const chromaticNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const keyIndex = chromaticNotes.indexOf(musicalKey);
    if (keyIndex === -1) return [];
    
    const tonic = musicalKey + "4";
    
    const subdominantIndex = (keyIndex + 5) % 12;
    const subdominant = chromaticNotes[subdominantIndex] + "4";
    
    const dominantIndex = (keyIndex + 7) % 12;
    const dominant = chromaticNotes[dominantIndex] + "4";
    
    const chords = [
      [tonic, getNoteAtInterval(tonic, 4), getNoteAtInterval(tonic, 7)],
      [subdominant, getNoteAtInterval(subdominant, 4), getNoteAtInterval(subdominant, 7)],
      [dominant, getNoteAtInterval(dominant, 4), getNoteAtInterval(dominant, 7)],
      [tonic, getNoteAtInterval(tonic, 4), getNoteAtInterval(tonic, 7)]
    ];
    
    console.log(`Generated cadence chords for ${musicalKey}:`, chords);
    return chords;
  }, [musicalKey, getNoteAtInterval]);

  const stopCadence = useCallback(() => {
    if (cadenceRef.current) {
      console.log("Stopping cadence");
      cadenceRef.current.stop();
      cadenceRef.current.dispose();
      cadenceRef.current = null;
    }
    
    console.log("Stopping Tone.js transport");
    Tone.Transport.stop();
    setIsPlayingCadence(false);
  }, []);

  const playCadence = useCallback(async () => {
    if (Tone.context.state !== "running") {
      console.log("Starting Tone.js audio context");
      await Tone.start();
    }
  
    if (isPlayingCadence) {
      console.log("Stopping current cadence playback");
      stopCadence();
      return;
    }
  
    setIsPlayingCadence(true);
    console.log("Starting cadence playback");
  
    const chords = getCadenceChords();
    if (chords.length === 0 || !pianoRef.current) {
      console.error("No chords generated or piano not available");
      setIsPlayingCadence(false);
      return;
    }
  
    if (cadenceRef.current) {
      console.log("Disposing of existing cadence");
      cadenceRef.current.dispose();
    }
  
    let chordIndex = 0;
  
    cadenceRef.current = new Tone.Part((time, chord) => {
      if (chord && pianoRef.current) {
        console.log(`Playing chord ${chordIndex + 1}:`, chord);
        pianoRef.current.triggerAttackRelease(chord, "2n", time);
      }
  
      chordIndex++;
  
      if (chordIndex >= chords.length) {
        Tone.Transport.scheduleOnce(() => {
          console.log("Cadence complete");
          stopCadence();
          if (onCadenceComplete) {
            console.log("Calling onCadenceComplete callback");
            onCadenceComplete();
          }
        }, `+2n`);
      }
    }, chords.map((chord, i) => [i * Tone.Time("2n").toSeconds(), chord]));
  
    cadenceRef.current.start(0);
    console.log("Cadence part started");
  
    if (Tone.Transport.state !== "started") {
      console.log("Starting Tone.js transport");
      Tone.Transport.start();
    }
  }, [isPlayingCadence, stopCadence, getCadenceChords, onCadenceComplete]);

  useEffect(() => {
    if (pianoInstrument) {
      console.log("Using provided piano instrument");
      pianoRef.current = pianoInstrument;
    } else {
      const setupAudio = async () => {
        if (typeof window !== 'undefined') {
          console.log("Creating new piano sampler");
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
        }
      };
      
      setupAudio();
    }
    
    Tone.Transport.bpm.value = bpm * 2;
    console.log(`Set BPM to ${bpm * 2}`);

    if (autoPlay) {
      console.log("AutoPlay enabled, starting cadence playback");
      setTimeout(() => {
        playCadence();
      }, 300);
    }

    return () => {
      if (cadenceRef.current) {
        console.log("Cleaning up cadence");
        cadenceRef.current.dispose();
      }
    };
  }, [bpm, pianoInstrument, autoPlay, playCadence]);

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
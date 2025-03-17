"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { availableNotes } from '@/lib/generators';
import { rhythmGenerator } from '@/lib/generators';
import Piano from './Piano';

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
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<boolean[]>([]);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [pianoPanelOpen, setPianoPanelOpen] = useState<boolean>(false);
  const [playPianoSound, setPlayPianoSound] = useState<boolean>(true);
  const [fullSequence, setFullSequence] = useState<SequenceNote[]>([]);
  const [degreesMap, setDegreesMap] = useState<Record<string, string>>({});
  const [noteToDegreeMap, setNoteToDegreeMap] = useState<Record<string, string>>({});
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isPlayingCadence, setIsPlayingCadence] = useState<boolean>(false);
  const [hideNotes, setHideNotes] = useState<boolean>(true);

  const pianoRef = useRef<Tone.Sampler | null>(null);
  const metronomeRef = useRef<Tone.MembraneSynth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const cadenceRef = useRef<Tone.Sequence | null>(null);
  const loopCountRef = useRef<number>(0);

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
    
        metronomeRef.current = new Tone.MembraneSynth({
          volume: -10
        }).toDestination();
      
        Tone.Transport.bpm.value = bpm * 2;
      }
    };
    
    setupAudio();
    setQuestionCount(numberOfNotes);
    setUserAnswers(Array(numberOfNotes).fill(''));
    createDegreesMap();

    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
      if (cadenceRef.current) {
        cadenceRef.current.dispose();
      }
      if (pianoRef.current) {
        pianoRef.current.dispose();
      }
      if (metronomeRef.current) {
        metronomeRef.current.dispose();
      }
    };
  }, [bpm, numberOfNotes]);

  const createDegreesMap = () => {
    const chromaticNotes: string[] = [
      "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
    ];

    const keyIndex = chromaticNotes.indexOf(musicalKey);
    if (keyIndex === -1) {
      return;
    }

    const degreeToNoteMap: Record<string, string> = {};
    const noteToDegrees: Record<string, string> = {};

    for (let i = 0; i < chromaticNotes.length; i++) {
      const noteIndex = (keyIndex + i) % chromaticNotes.length;
      const note = chromaticNotes[noteIndex];

      let degree;
      switch (i) {
        case 0: degree = "1"; break;
        case 1: degree = "1#"; break;
        case 2: degree = "2"; break;
        case 3: degree = "2#"; break;
        case 4: degree = "3"; break;
        case 5: degree = "4"; break;
        case 6: degree = "4#"; break;
        case 7: degree = "5"; break;
        case 8: degree = "5#"; break;
        case 9: degree = "6"; break;
        case 10: degree = "6#"; break;
        case 11: degree = "7"; break;
        default: degree = "?";
      }

      degreeToNoteMap[degree] = note;
      noteToDegrees[note] = degree;
    }

    setDegreesMap(degreeToNoteMap);
    setNoteToDegreeMap(noteToDegrees);
  };

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
      // I chord
      [tonic, getNoteAtInterval(tonic, 4), getNoteAtInterval(tonic, 7)],
      // IV chord
      [subdominant, getNoteAtInterval(subdominant, 4), getNoteAtInterval(subdominant, 7)],
      // V chord
      [dominant, getNoteAtInterval(dominant, 4), getNoteAtInterval(dominant, 7)],
      // I chord
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
  
  if (isPlayingCadence || isPlaying) {
    stopCadence();
    stopPlaying();
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
  cadenceRef.current = new Tone.Sequence(
    (time, chord) => {
      if (chord && Array.isArray(chord) && pianoRef.current) {
        // Ensure chord is an array before using forEach
        chord.forEach(note => {
          pianoRef.current?.triggerAttackRelease(note, "2n", time);
        });
      }
      
      chordIndex++;
      
      if (chordIndex >= chords.length) {
        Tone.Transport.scheduleOnce(() => {
          stopCadence();
        }, "+2n");
      }
    },
    chords,
    "2n"
  );
  
  cadenceRef.current.start(0);
  
  if (Tone.Transport.state !== "started") {
    Tone.Transport.start();
  }
};

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
    for (let i = 0; i < questionCount; i++) {
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
        allowRests: rhythm,
        restProbability: 0.2
      }) as RhythmItem[];
    } else {
      rhythmSequence = Array(questionCount).fill(null).map(() => ({
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
    setFullSequence(finalSequence);

    setUserAnswers(Array(sequence.length).fill(''));
    setFeedback(Array(sequence.length).fill(false));
    setShowFeedback(false);

    return { notes: sequence, fullSequence: finalSequence };
  };

  const playSequence = async (sequence: { notes: string[], fullSequence: SequenceNote[] }): Promise<void> => {
    if (!sequence || sequence.fullSequence.length === 0) return;
    
    // Ensure audio context is running
    if (Tone.context.state !== "running") {
      await Tone.start();
    }
    
    // Clean up any existing sequence
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
    }

    loopCountRef.current = 0;
    setIsPlaying(true);

    const events = sequence.fullSequence.map(item => item);
    
    let index = 0;
    sequenceRef.current = new Tone.Sequence(
      (time, value) => {
        // Play metronome at the start of each loop
        if (index === 0 && loop && loopCountRef.current > 0 && metronomeRef.current) {
          metronomeRef.current.triggerAttackRelease("C2", "16n", time);
        }
        
        // Get the current item
        const currentItem = events[index];
        
        if (currentItem && currentItem.type === "note" && pianoRef.current) {
          pianoRef.current.triggerAttackRelease(currentItem.note, currentItem.duration, time);
          setCurrentNote(index);
        }

        index++;

        if (index >= events.length) {
          loopCountRef.current++;
          
          if (!loop) {
            Tone.Transport.scheduleOnce(() => {
              stopPlaying();
            }, "+0.1");
            return;
          }
          
          index = 0; // Reset for looping
        }
      },
      events,
      "4n"
    );

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
    if (isPlaying) {
      stopPlaying();
      return;
    }

    if (fullSequence.length === 0 || generatedSequence.length === 0) {
      const newSequence = generateNewSequence();
      playSequence(newSequence);
    } else {
      playSequence({ notes: generatedSequence, fullSequence });
    }
    
    setIsPlaying(true);
  };

  const handleUserAnswerChange = (index: number, value: string): void => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const checkAnswers = (): void => {
    const results = userAnswers.map((answer, index) => {
      const expected = generatedSequence[index].replace(/\d+$/, ''); // Strip octave numbers
      const given = answer.replace(/\d+$/, '');
      return expected.toLowerCase() === given.toLowerCase();
    });
    setFeedback(results);
    setShowFeedback(true);
  };

  const handleNoteClick = (note: string): void => {
    const activeIndex = userAnswers.findIndex(answer => answer === '');
    if (activeIndex !== -1) {
      handleUserAnswerChange(activeIndex, note);
    } else {
      // If no empty answer, update the last one
      handleUserAnswerChange(userAnswers.length - 1, note);
    }

    if (playPianoSound && pianoRef.current) {
      const noteWithOctave = note.includes('3') ? note : `${note}3`;
      pianoRef.current.triggerAttackRelease(noteWithOctave, "8n");
    }
  };

  const resetGame = (): void => {
    if (isPlaying) {
      stopPlaying();
    }
    const newSequence = generateNewSequence();
    setCurrentNote(0);
    setUserAnswers(Array(newSequence.notes.length).fill(''));
    setFeedback(Array(newSequence.notes.length).fill(false));
    setShowFeedback(false);
  };

  const togglePianoPanel = (): void => {
    setPianoPanelOpen(!pianoPanelOpen);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
      <div className="flex w-full space-x-4 mb-4">
        <button 
          onClick={handlePlayClick}
          className={`px-4 py-2 rounded-lg font-medium text-white ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
        >
          {isPlaying ? 'Stop' : 'Play Melody'}
        </button>

        <button 
          onClick={playCadence}
          className={`px-4 py-2 rounded-lg font-medium text-white ${isPlayingCadence ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          {isPlayingCadence ? 'Stop Cadence' : 'Play Cadence'}
        </button>

        <button 
          onClick={resetGame}
          className="px-4 py-2 rounded-lg font-medium text-white bg-gray-500 hover:bg-gray-600"
        >
          New Melody
        </button>
      </div>

      {rhythm && (
        <div className="w-full mb-4 bg-gray-100 p-3 rounded-lg">
          <div className="text-sm font-medium mb-2">Rhythm:</div>
          <div className="flex space-x-2">
            {fullSequence.map((item, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-center rounded-lg ${
                  item.type === "note" 
                    ? currentNote === index && isPlaying
                      ? "bg-green-500 text-white" 
                      : "bg-blue-200"
                    : "bg-gray-300"
                }`}
                style={{ 
                  width: `${Math.max(item.duration === "1n" ? 128 : item.duration === "2n" ? 64 : item.duration === "4n" ? 32 : 16, 32)}px`,
                  height: "32px"
                }}
              >
                {item.type === "note" ? (hideNotes ? "●" : item.note.replace(/\d+$/, '')) : "–"}
              </div>
            ))}
          </div>
        </div>
      )}

      {!hideNotes && (
        <div className="w-full mb-6">
          <div className="text-sm font-medium mb-2">Generated Sequence:</div>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {generatedSequence.map((note, index) => (
              <div 
                key={index} 
                className={`px-3 py-1 rounded-md ${
                  currentNote === index && isPlaying 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-100"
                }`}
              >
                {note.replace(/\d+$/, '')}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="w-full mb-6">
        <div className="text-sm font-medium mb-2">Your Answer:</div>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {userAnswers.map((answer, index) => (
            <div 
              key={index} 
              className={`px-3 py-1 rounded-md min-w-[40px] h-[32px] text-center ${
                showFeedback 
                  ? feedback[index] ? "bg-green-100 border border-green-500" : "bg-red-100 border border-red-500"
                  : "bg-gray-100 border border-gray-300"
              }`}
            >
              {answer}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full flex justify-between mb-4">
        <button 
          onClick={togglePianoPanel}
          className="px-4 py-2 rounded-lg font-medium text-white bg-purple-500 hover:bg-purple-600"
        >
          {pianoPanelOpen ? 'Hide Piano' : 'Show Piano'}
        </button>

        <button 
          onClick={checkAnswers}
          className="px-4 py-2 rounded-lg font-medium text-white bg-yellow-500 hover:bg-yellow-600"
          disabled={userAnswers.some(answer => answer === '')}
        >
          Check Answers
        </button>
      </div>

      {pianoPanelOpen && (
        <div className="w-full mt-4 border rounded-lg p-4 bg-gray-50">
          <div className="mb-2 flex items-center">
            <input 
              type="checkbox" 
              id="playSound" 
              checked={playPianoSound} 
              onChange={() => setPlayPianoSound(!playPianoSound)}
              className="mr-2"
            />
            <label htmlFor="playSound">Play sound on click</label>
          </div>
          <Piano 
            onNoteClick={handleNoteClick} 
            highlightedNotes={notes}
            musicalKey={musicalKey}
            range={range}
            sampler={pianoRef.current}
          />
        </div>
      )}

      {showFeedback && (
        <div className="w-full mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-lg font-medium mb-2">Results:</div>
          <div className="flex flex-col space-y-2">
            {feedback.map((result, index) => (
              <div 
                key={index} 
                className={`px-3 py-2 rounded-md ${result ? "bg-green-100" : "bg-red-100"}`}
              >
                {result ? (
                  <>
                    <span className="font-medium">Correct!</span> The note was {generatedSequence[index].replace(/\d+$/, '')}.
                  </>
                ) : (
                  <>
                    <span className="font-medium">Incorrect.</span> You entered {userAnswers[index]}, but the note was {generatedSequence[index].replace(/\d+$/, '')}.
                  </>
                )}
              </div>
            ))}
            <div className="mt-2 text-lg">
              Score: {feedback.filter(Boolean).length} out of {feedback.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MelodyGenerator;
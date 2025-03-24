"use client"
import React, { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { playSequence, createFullSequence } from '../lib/melodyGenerators';
import { generateNoteSequence, rhythmGenerator, getDegreeFromNote, getNoteFromDegree } from '../lib/melodyGenerators';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type MetronomeInstruments = {
  metronome: Tone.MembraneSynth;
  metronomeAccent: Tone.MembraneSynth;
};

type NoteSequence = string[];

type SequenceItem = {
  type: string;
  note?: string;
  duration: string;
  value: number;
  startTime: number;
};

type MelodyData = {
  notes: NoteSequence;
  fullSequence: SequenceItem[];
};

type Player = {
  play: () => void;
  stop: () => void;
  isPlaying: boolean;
  onStop: () => void;
  notes?: string[];
  fullSequence?: SequenceItem[];
  currentNoteCallback?: (index: number) => void;
};

type ExerciseParams = {
  totalQuestions: number;
  keyId: string;
  notesPerQuestion: number;
  bpm: number;
  showPreview: boolean;
  previewDuration: number;
  maxInterval: number;
  minInterval: number;
};

type ExerciseResults = {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timestamp: string;
  exerciseId: string;
};

const defaultParams: ExerciseParams = {
  totalQuestions: 5,
  keyId: "C",
  notesPerQuestion: 3,
  bpm: 100,
  showPreview: true,
  previewDuration: 5000,
  maxInterval: 5,
  minInterval: 1
};

const MelodyInquirer = () => {
  const [piano, setPiano] = useState<Tone.Sampler | Tone.PolySynth<Tone.Synth<Tone.SynthOptions>> | null>(null);
  const [metronomeInstruments, setMetronomeInstruments] = useState<MetronomeInstruments | null>(null);
  const [currentMelody, setCurrentMelody] = useState<MelodyData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [keyId, setKeyId] = useState<string>("C");
  const [showMelody, setShowMelody] = useState<boolean>(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(-1);
  const [questionCount, setQuestionCount] = useState<number>(1);
  const [exerciseParams, setExerciseParams] = useState<ExerciseParams>(defaultParams);
  const [completedQuestions, setCompletedQuestions] = useState<number[]>([]);
  const [showCompletionDialog, setShowCompletionDialog] = useState<boolean>(false);
  const [finalResults, setFinalResults] = useState<ExerciseResults | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchExerciseParams();
    
    const initializeInstruments = async () => {
      const metronome = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 3,
        oscillator: { type: "sine" },
        envelope: {
          attack: 0.001,
          decay: 0.2,
          sustain: 0.05,
          release: 0.5
        }
      }).toDestination();
      
      const metronomeAccent = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 5,
        oscillator: { type: "sine" },
        envelope: {
          attack: 0.001,
          decay: 0.4,
          sustain: 0.1,
          release: 0.5
        }
      }).toDestination();

      setMetronomeInstruments({ metronome, metronomeAccent });

      try {
        const newPiano = new Tone.Sampler({
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
          onload: () => {
            setPiano(newPiano);
            setIsLoading(false);
          }
        }).toDestination();
      } catch (error) {
        console.error("Error loading piano samples:", error);
        const fallbackPiano = new Tone.PolySynth(Tone.Synth, {
          envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.3,
            release: 1
          }
        }).toDestination();
        
        setPiano(fallbackPiano);
        setIsLoading(false);
      }
    };

    initializeInstruments();

    return () => {
      if (piano) piano.dispose();
      if (metronomeInstruments) {
        metronomeInstruments.metronome.dispose();
        metronomeInstruments.metronomeAccent.dispose();
      }
    };
  }, []);

  const fetchExerciseParams = async () => {
    try {
      // Simulated fetch for exercise parameters
      await new Promise(resolve => setTimeout(resolve, 500));
      const params: ExerciseParams = {
        ...defaultParams,
        // Simulate fetched parameters
        totalQuestions: 5,
        keyId: "C"
      };
      
      setExerciseParams(params);
      setKeyId(params.keyId);
    } catch (error) {
      console.error("Error fetching exercise parameters:", error);
    }
  };

  const saveResults = async (results: ExerciseResults) => {
    setIsSaving(true);
    try {
      // Simulated API call to save results
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Results saved:", results);
      setIsSaving(false);
      return true;
    } catch (error) {
      console.error("Error saving results:", error);
      setIsSaving(false);
      return false;
    }
  };

  useEffect(() => {
    if (currentMelody && currentMelody.notes) {
      setUserAnswers(Array(currentMelody.notes.length).fill(''));
      setShowResults(false);
      
      if (exerciseParams.showPreview) {
        setShowMelody(true);
        const melodyTimer = setTimeout(() => {
          setShowMelody(false);
        }, exerciseParams.previewDuration);
        
        return () => clearTimeout(melodyTimer);
      }
    }
  }, [currentMelody, exerciseParams.previewDuration, exerciseParams.showPreview]);

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const handleCheckAnswers = () => {
    if (!currentMelody) return;
    
    setShowResults(true);
    
    const currentResults = userAnswers.filter((answer, index) => 
      answer === getDegreeFromNote(currentMelody.notes[index], keyId)
    ).length;
    
    const newCompletedQuestions = [...completedQuestions, currentResults];
    setCompletedQuestions(newCompletedQuestions);
    
    if (questionCount >= exerciseParams.totalQuestions) {
      const totalCorrect = [...newCompletedQuestions].reduce((sum, curr) => sum + curr, 0);
      const totalPossible = exerciseParams.notesPerQuestion * exerciseParams.totalQuestions;
      const percentage = Math.round((totalCorrect / totalPossible) * 100);
      
      const results: ExerciseResults = {
        totalQuestions: exerciseParams.totalQuestions,
        correctAnswers: totalCorrect,
        percentage,
        timestamp: new Date().toISOString(),
        exerciseId: `exercise-${Date.now()}`
      };
      
      setFinalResults(results);
      setShowCompletionDialog(true);
    }
  };

  const handleChangeKey = (newKey: string) => {
    setKeyId(newKey);
  };

  const handleNextQuestion = () => {
    if (isPlaying && player) {
      player.stop();
      setIsPlaying(false);
      setPlayer(null);
    }
    
    setShowResults(false);
    setCurrentNoteIndex(-1);
    setQuestionCount(prev => prev + 1);
    
    setTimeout(() => {
      handlePlay();
    }, 300);
  };

  const startNewExercise = async () => {
    if (finalResults) {
      await saveResults(finalResults);
    }
    
    setQuestionCount(1);
    setCompletedQuestions([]);
    setShowCompletionDialog(false);
    setFinalResults(null);
    setShowResults(false);
    setCurrentNoteIndex(-1);
    
    setTimeout(() => {
      handlePlay();
    }, 300);
  };

  const updateCurrentNoteIndex = (index: number) => {
    setTimeout(() => {
      setCurrentNoteIndex(index);
    }, 0);
  };

  const handlePlay = async () => {
    if (isPlaying && player) {
      player.stop();
      setIsPlaying(false);
      setPlayer(null);
      setCurrentNoteIndex(-1);
      return;
    }
    
    if (!piano || !metronomeInstruments) {
      return;
    }

    try {
      await Tone.start();
      
      const cMajorNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      const noteRange = ['C4', 'C5'];
      
      const numberOfNotes = exerciseParams.notesPerQuestion;
      
      const melodyNotes = generateNoteSequence({
        keyId,
        notes: cMajorNotes.map(note => note + '4'),
        range: noteRange,
        numberOfNotes,
        maxInterval: exerciseParams.maxInterval,
        minInterval: exerciseParams.minInterval
      });
      
      let finalNotes: string[] = melodyNotes;
      
      if (!melodyNotes.length || melodyNotes.length < numberOfNotes) {
        const cMajorScale = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        const fallbackNotes: string[] = [];
        for (let i = 0; i < numberOfNotes; i++) {
          const randomIndex = Math.floor(Math.random() * cMajorScale.length);
          fallbackNotes.push(cMajorScale[randomIndex]);
        }
        
        finalNotes = fallbackNotes;
      }
      
      const rhythmPattern = rhythmGenerator({
        totalBeats: 8,
        n: finalNotes.length,
        allowRests: false,
        shortestDuration: "8n",
        longestDuration: "2n"
      });
      
      const fullSequence = createFullSequence(finalNotes, rhythmPattern);
      
      setCurrentMelody({ notes: finalNotes, fullSequence });
      setCurrentNoteIndex(-1);
      
      const currentNoteCallback = (index: number) => {
        updateCurrentNoteIndex(index);
      };
      
      const newPlayerObj = await playSequence({
        generatedNotes: finalNotes,
        fullSequence: fullSequence,
        piano: piano,
        metronomeInstruments: metronomeInstruments,
        loop: true,
        bpm: exerciseParams.bpm,
        onNotePlay: (time: number, note: string, index: number) => {
          currentNoteCallback(index);
        },
        onLoopEnd: () => {
          setIsPlaying(false);
          currentNoteCallback(-1);
        }
      });
      
      const typedPlayer: Player = {
        ...newPlayerObj,
        notes: finalNotes,
        fullSequence,
        currentNoteCallback,
        onStop: () => {
          setIsPlaying(false);
          currentNoteCallback(-1);
        }
      };
      
      setPlayer(typedPlayer);
      typedPlayer.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing melody:", error);
      setIsPlaying(false);
    }
  };

  const getExampleNoteFromDegree = (degree: string) => {
    return getNoteFromDegree(degree, keyId);
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Melody Grade Identification - Question {questionCount}/{exerciseParams.totalQuestions}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="mb-4 text-center">
            <p>Listen to the melody and identify the scale degrees in key of {keyId}</p>
            <div className="mt-2">
              <select 
                className="px-2 py-1 border rounded"
                value={keyId}
                onChange={(e) => handleChangeKey(e.target.value)}
              >
                {['C', 'G', 'D', 'A', 'E', 'B', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>
          </div>
          
          <Button 
            className={`w-32 mb-4 ${!isPlaying && !player ? 'bg-blue-500 hover:bg-blue-600' : isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            disabled={isLoading} 
            onClick={handlePlay}
          >
            {isPlaying ? "Stop" : player ? "Play Again" : "Play Melody"}
          </Button>
          
          {isLoading && <p className="mt-2 text-sm text-gray-500">Loading sounds...</p>}
          
          {showMelody && currentMelody && currentMelody.notes && (
            <div className="w-full mt-2 mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="font-medium text-center mb-1">Generated Melody (visible for {exerciseParams.previewDuration/1000} seconds):</p>
              <p className="text-center">{currentMelody.notes.join(', ')}</p>
            </div>
          )}
          
          {currentMelody && currentMelody.notes && (
            <div className="w-full mt-4">
              <div className="flex gap-2 justify-center">
                {currentMelody.notes.map((note, index) => (
                  <div 
                    key={index} 
                    className={`
                      w-14 h-14 relative transition-all duration-300
                      ${currentNoteIndex === index ? 'bg-yellow-200 scale-110 shadow-md ring-2 ring-yellow-400' : 'bg-white'}
                      ${showResults 
                        ? userAnswers[index] === getDegreeFromNote(note, keyId) 
                          ? 'border-2 border-green-500' 
                          : 'border-2 border-red-500' 
                        : 'border border-gray-300'}
                      rounded-md overflow-hidden
                    `}
                  >
                    <Input
                      value={userAnswers[index]}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder=""
                      className="w-full h-full text-center p-0 text-lg font-bold"
                      maxLength={2}
                    />
                    {showResults && (
                      <span className="absolute -bottom-6 text-xs font-medium">
                        {getDegreeFromNote(note, keyId)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex gap-2 justify-center">
                <Button 
                  className="flex-1" 
                  onClick={handleCheckAnswers}
                  disabled={userAnswers.some(answer => answer === '') || showResults}
                >
                  Check Answers
                </Button>
                
                {showResults && questionCount < exerciseParams.totalQuestions && (
                  <Button 
                    className="flex-1 bg-green-500 hover:bg-green-600" 
                    onClick={handleNextQuestion}
                  >
                    Next Question
                  </Button>
                )}
              </div>
              
              {showResults && (
                <div className="mt-4 p-4 bg-gray-100 rounded-md">
                  <h3 className="font-bold mb-2">Results</h3>
                  <p>Correct answers: {userAnswers.filter((answer, index) => 
                    answer === getDegreeFromNote(currentMelody.notes[index], keyId)
                  ).length} / {currentMelody.notes.length}</p>
                  <p className="mt-2 text-sm">Example: In {keyId} key, degree 1 is {getExampleNoteFromDegree("1")}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exercise Complete!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {finalResults && (
              <div className="flex flex-col items-center">
                <div className="text-6xl font-bold text-blue-500 mb-4">
                  {finalResults.percentage}%
                </div>
                <p className="text-center mb-2">
                  You correctly identified {finalResults.correctAnswers} out of {finalResults.totalQuestions * exerciseParams.notesPerQuestion} notes
                </p>
                <div className="w-full h-4 bg-gray-200 rounded-full mt-4">
                  <div 
                    className="h-4 bg-blue-500 rounded-full" 
                    style={{ width: `${finalResults.percentage}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={startNewExercise} disabled={isSaving}>
              {isSaving ? "Saving..." : "Start New Exercise"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MelodyInquirer;
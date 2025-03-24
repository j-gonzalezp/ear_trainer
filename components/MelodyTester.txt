"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, HelpCircle, Play, Square, Repeat, RefreshCw, SkipForward, Music } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import * as Tone from 'tone';
import { playSequence, createPiano, createMetronome } from '@/lib/melodyGenerators';
import Piano from './Piano';
import CadencePlayer from './CadencePlayer';

interface MelodyTesterProps {
  melody: {
    notes: string[];
    fullSequence: any[];
  } | null;
  onGenerateNew: () => void;
  keySignature?: string;
  config?: any;
  InputComponent?: React.ComponentType<any>;
}

const MelodyTester: React.FC<MelodyTesterProps> = ({ 
  melody, 
  onGenerateNew, 
  keySignature = "C",
  config = {},
  InputComponent = null
}) => {
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null);
  const [loopEnabled, setLoopEnabled] = useState(config.loop || false);
  const [activeInputIndex, setActiveInputIndex] = useState(0);
  const [activeAnimations, setActiveAnimations] = useState<number[]>([]);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isCadencePlaying, setIsCadencePlaying] = useState(false);
  const [hasPlayedCadence, setHasPlayedCadence] = useState(false);
  
  const melodyPlayerRef = useRef<any>(null);
  const currentMelodyRef = useRef<any>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pianoRef = useRef<any>(null);
  const metronomeRef = useRef<any>(null);
  const animationTimersRef = useRef<any[]>([]);
  const loopCountRef = useRef<number>(0);

  const buildKeyMap = (key: string) => {
    const allNoteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const keyIndex = allNoteNames.indexOf(key.replace(/\d+$/, ''));
    
    const majorScaleSteps = [0, 2, 4, 5, 7, 9, 11];
    
    const scaleNotes = majorScaleSteps.map(step => 
      allNoteNames[(keyIndex + step) % 12]
    );
    
    const keyMap = {};
    allNoteNames.forEach(note => {
      const noteIndex = allNoteNames.indexOf(note);
      let found = false;
      
      for (let i = 0; i < scaleNotes.length; i++) {
        if (note === scaleNotes[i]) {
          keyMap[note] = (i + 1).toString();
          found = true;
          break;
        }
      }
      
      if (!found) {
        let lowerNoteIndex = -1;
        for (let i = (noteIndex - 1 + 12) % 12; i !== noteIndex; i = (i - 1 + 12) % 12) {
          if (scaleNotes.includes(allNoteNames[i])) {
            lowerNoteIndex = i;
            break;
          }
        }
        
        if (lowerNoteIndex !== -1) {
          const lowerScaleDegree = scaleNotes.indexOf(allNoteNames[lowerNoteIndex]) + 1;
          keyMap[note] = `${lowerScaleDegree}#`;
        } else {
          keyMap[note] = note;
        }
      }
    });
    
    return keyMap;
  };

  const getDegreeNotes = () => {
    return config.notes || ["1", "2", "3", "4", "5", "6", "7"];
  };

  useEffect(() => {
    if (melody) {
      console.log("New melody loaded:", melody);
      currentMelodyRef.current = melody;
      const noteCount = melody.fullSequence.filter(item => item.type === "note").length;
      setUserAnswers(Array(noteCount).fill(""));
      setResults(Array(noteCount).fill(false));
      setShowAnswers(false);
      setScore(0);
      setSubmitted(false);
      setCurrentNoteIndex(null);
      setActiveInputIndex(0);
      setActiveAnimations([]);
      setHasPlayedCadence(false);
      inputRefs.current = Array(noteCount).fill(null);
      loopCountRef.current = 0;
      
      animationTimersRef.current.forEach(timer => clearTimeout(timer.id));
      animationTimersRef.current = [];
    }
    
    return () => {
      if (melodyPlayerRef.current) {
        try {
          melodyPlayerRef.current.stop();
        } catch (e) {
          console.error("Error stopping player:", e);
        }
        melodyPlayerRef.current = null;
      }
      
      animationTimersRef.current.forEach(timer => clearTimeout(timer.id));
    };
  }, [melody]);

  useEffect(() => {
    if (!pianoRef.current) {
      pianoRef.current = createPiano();
    }
    
    if (!metronomeRef.current) {
      metronomeRef.current = createMetronome();
      
      if (metronomeRef.current && metronomeRef.current.volume) {
        metronomeRef.current.volume.value = -12;
      }
    }
    
    if (pianoRef.current && pianoRef.current.volume) {
      pianoRef.current.volume.value = 0;
    }
    
    if (config && config.loop !== undefined) {
      setLoopEnabled(config.loop);
    }
    
    return () => {
      if (melodyPlayerRef.current) {
        try {
          melodyPlayerRef.current.stop();
        } catch (e) {
          console.error("Error stopping player:", e);
        }
        melodyPlayerRef.current = null;
      }
      
      animationTimersRef.current.forEach(timer => clearTimeout(timer.id));
    };
  }, [config]);

  useEffect(() => {
    if (isPlaying && melodyPlayerRef.current && !isProcessingAudio) {
      console.log("Loop setting changed while playing. Restarting playback");
      setIsProcessingAudio(true);
      
      try {
        const currentPlayer = melodyPlayerRef.current;
        currentPlayer.stop();
        melodyPlayerRef.current = null;
      } catch (e) {
        console.error("Error stopping player:", e);
      }
      
      setTimeout(() => {
        if (melody) {
          handlePlayMelody();
        }
        setIsProcessingAudio(false);
      }, 300);
    }
  }, [loopEnabled]);

  const clearAllAnimations = () => {
    setActiveAnimations([]);
    animationTimersRef.current.forEach(timer => {
      clearTimeout(timer.id);
    });
    animationTimersRef.current = [];
  };

  const animateNoteInput = (index) => {
    if (index === null || index === undefined) return;
    
    setActiveAnimations(prev => {
      if (!prev.includes(index)) {
        return [...prev, index];
      }
      return prev;
    });
    
    animationTimersRef.current = animationTimersRef.current.filter(timer => {
      if (timer.index === index) {
        clearTimeout(timer.id);
        return false;
      }
      return true;
    });
    
    const timerId = setTimeout(() => {
      setActiveAnimations(prev => prev.filter(i => i !== index));
    }, 1000);
    
    animationTimersRef.current.push({ id: timerId, index });
  };

  const handlePlayMelody = async () => {
    if (!melody || isProcessingAudio || isCadencePlaying) {
      return;
    }
    
    if (isPlaying && melodyPlayerRef.current) {
      setIsProcessingAudio(true);
      try {
        melodyPlayerRef.current.stop();
        melodyPlayerRef.current = null;
      } catch (e) {
        console.error("Error stopping player:", e);
      }
      setIsPlaying(false);
      setCurrentNoteIndex(null);
      clearAllAnimations();
      
      setTimeout(() => {
        setIsProcessingAudio(false);
      }, 300);
      return;
    }
    
    try {
      setIsProcessingAudio(true);
      await Tone.start();
      
      if (!hasPlayedCadence) {
        setIsCadencePlaying(true);
        setHasPlayedCadence(true);
        return;
      }
      
      await playMelodySequence();
    } catch (error) {
      console.error("Error playing melody:", error);
    } finally {
      setTimeout(() => {
        setIsProcessingAudio(false);
      }, 300);
    }
  };
  
  const handlePlayCadence = async () => {
    if (isProcessingAudio || isPlaying || isCadencePlaying) {
      return;
    }
    
    try {
      setIsProcessingAudio(true);
      await Tone.start();
      setIsCadencePlaying(true);
    } catch (error) {
      console.error("Error playing cadence:", error);
    } finally {
      setTimeout(() => {
        setIsProcessingAudio(false);
      }, 300);
    }
  };
  
  const playMelodySequence = async () => {
    loopCountRef.current = 0;
    
    const handleNotePlay = (time, note, index) => {
      const scheduledTime = Math.max(0, (time - Tone.now()) * 1000);
      setTimeout(() => {
        setCurrentNoteIndex(index);
        animateNoteInput(index);
      }, scheduledTime);
    };
    
    const handleLoopStart = () => {
      loopCountRef.current += 1;
      clearAllAnimations();
    };
    
    const handleLoopEnd = () => {
      const notesLength = melody.fullSequence.filter(item => item.type === "note").length;
      if (notesLength > 0) {
        animateNoteInput(notesLength - 1);
      }
    };
    
    const playConfig = {
      generatedNotes: melody.notes,
      fullSequence: melody.fullSequence,
      piano: pianoRef.current,
      metronomeInstruments: metronomeRef.current,
      loop: loopEnabled,
      bpm: config.bpm || 120,
      onNotePlay: handleNotePlay,
      onLoopStart: handleLoopStart,
      onLoopEnd: handleLoopEnd
    };
    
    melodyPlayerRef.current = await playSequence(playConfig);
    
    melodyPlayerRef.current.onStop = () => {
      setIsPlaying(false);
      setCurrentNoteIndex(null);
      clearAllAnimations();
    };
    
    melodyPlayerRef.current.play();
    setIsPlaying(true);
    
    if (!loopEnabled) {
      Tone.Transport.bpm.value = config.bpm || 120;
      
      const totalDuration = melody.fullSequence.reduce(
        (total, item) => total + (item.value || 0), 
        0
      ) * (60 / Tone.Transport.bpm.value) * 1000;
      
      setTimeout(() => {
        setIsPlaying(false);
        setCurrentNoteIndex(null);
        clearAllAnimations();
      }, totalDuration + 1000);
    }
  };

  const handleCadenceComplete = async () => {
    setIsCadencePlaying(false);
    await playMelodySequence();
  };

  const handleReplayMelody = async () => {
    if (isProcessingAudio || isCadencePlaying) return;
    
    setIsProcessingAudio(true);
    
    if (melodyPlayerRef.current) {
      try {
        melodyPlayerRef.current.stop();
        melodyPlayerRef.current = null;
      } catch (e) {
        console.error("Error stopping player:", e);
      }
    }
    
    setIsPlaying(false);
    setCurrentNoteIndex(null);
    clearAllAnimations();
    
    setTimeout(() => {
      handlePlayMelody();
      setIsProcessingAudio(false);
    }, 300);
  };

  const handleInputChange = (index: number, value: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
    
    if (value && index < userAnswers.length - 1) {
      setActiveInputIndex(index + 1);
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handlePianoKeyPress = (degree: string) => {
    if (activeInputIndex < userAnswers.length && !submitted) {
      handleInputChange(activeInputIndex, degree);
    }
  };

  const validateAnswers = () => {
    if (!melody) return;
    
    const keyMap = buildKeyMap(keySignature);
    
    const actualNotes = melody.fullSequence
      .filter(item => item.type === "note")
      .map(item => item.note);
    
    const correctAnswers = actualNotes.map(note => {
      const noteName = note.replace(/\d+$/, '');
      return keyMap[noteName] || noteName;
    });
    
    const newResults = correctAnswers.map((correctAnswer, index) => {
      const userAnswer = userAnswers[index].trim();
      return userAnswer.toLowerCase() === correctAnswer.toLowerCase();
    });
    
    setResults(newResults);
    setScore(newResults.filter(Boolean).length);
    setSubmitted(true);
  };

  const handleShowAnswers = () => {
    setShowAnswers(true);
  };

  const handleNextMelody = () => {
    if (isProcessingAudio || isCadencePlaying) return;
    
    setIsProcessingAudio(true);
    const currentLoop = loopEnabled;
    
    if (melodyPlayerRef.current) {
      try {
        melodyPlayerRef.current.stop();
        melodyPlayerRef.current = null;
      } catch (e) {
        console.error("Error stopping player:", e);
      }
    }
    
    clearAllAnimations();
    setIsPlaying(false);
    onGenerateNew();
    
    setTimeout(() => {
      setLoopEnabled(currentLoop);
      setIsProcessingAudio(false);
    }, 300);
  };

  const renderInputField = (index: number) => {
    const isCorrect = results[index];
    const isActive = currentNoteIndex === index;
    const isAnimating = activeAnimations.includes(index);
    
    const animationStyle = isAnimating ? {
      borderColor: '#FBBF24',
      borderWidth: '2px',
      boxShadow: '0 0 0 2px rgba(251, 191, 36, 0.5)',
      transform: 'scale(1.1)',
      zIndex: 10,
      transition: 'all 0.2s ease-in-out'
    } : {};
    
    const inputClasses = `
      w-14 h-12 text-center text-lg font-medium transition-all duration-200
      ${isActive ? "border-2 border-yellow-400" : ""}
      ${submitted && !showAnswers ? (isCorrect ? "bg-green-100 border-green-500" : "bg-red-100 border-red-500") : ""}
      focus:outline-none focus:ring-0 focus:border-inherit
    `;
    
    if (InputComponent) {
      const keyMap = buildKeyMap(keySignature);
      const correctNote = melody?.fullSequence.filter(item => item.type === "note")[index].note.replace(/\d+$/, '');
      const correctAnswer = keyMap[correctNote] || correctNote;
      
      return (
        <InputComponent
          ref={el => {
            inputRefs.current[index] = el;
            if (index === 0 && el && !userAnswers[0]) {
              setTimeout(() => el.focus(), 100);
            }
          }}
          value={userAnswers[index]}
          onChange={value => handleInputChange(index, value)}
          isCorrect={isCorrect}
          isSubmitted={submitted}
          isCurrentlyPlaying={isActive}
          isAnimating={isAnimating}
          disabled={showAnswers || submitted}
          actualAnswer={correctAnswer}
          showAnswer={showAnswers}
          onFocus={() => setActiveInputIndex(index)}
          style={animationStyle}
        />
      );
    }
    
    if (showAnswers) {
      const keyMap = buildKeyMap(keySignature);
      const correctNote = melody?.fullSequence.filter(item => item.type === "note")[index].note.replace(/\d+$/, '');
      const correctAnswer = keyMap[correctNote] || correctNote;
      
      return (
        <Input
          ref={el => inputRefs.current[index] = el}
          value={correctAnswer}
          className={inputClasses}
          maxLength={2}
          readOnly
          style={animationStyle}
        />
      );
    }
    
    return (
      <Input
        ref={el => {
          inputRefs.current[index] = el;
          if (index === 0 && el && !userAnswers[0]) {
            setTimeout(() => el.focus(), 100);
          }
        }}
        value={userAnswers[index]}
        onChange={e => handleInputChange(index, e.target.value)}
        className={inputClasses}
        maxLength={2}
        onFocus={() => setActiveInputIndex(index)}
        readOnly={submitted}
        style={animationStyle}
        data-active={isActive}
        data-animating={isAnimating}
      />
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>Melody Tester - {keySignature} Major</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="loop-mode"
                checked={loopEnabled}
                onCheckedChange={value => {
                  setLoopEnabled(value);
                }}
                disabled={isProcessingAudio || isCadencePlaying}
              />
              <Label htmlFor="loop-mode">Loop</Label>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                onClick={handlePlayMelody} 
                variant={isPlaying ? "destructive" : "default"}
                disabled={!melody || isProcessingAudio || isCadencePlaying}
              >
                {isPlaying ? <Square className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isPlaying ? "Stop" : "Play Melody"}
              </Button>
              <Button
                onClick={handlePlayCadence}
                variant="outline"
                disabled={!melody || isPlaying || isProcessingAudio || isCadencePlaying}
              >
                <Music className="mr-2 h-4 w-4" />
                Play Cadence
              </Button>
              <Button 
                onClick={handleReplayMelody} 
                variant="outline"
                disabled={!melody || isPlaying || isProcessingAudio || isCadencePlaying}
              >
                <Repeat className="mr-2 h-4 w-4" />
                Replay
              </Button>
              {!submitted && (
                <Button 
                  onClick={handleNextMelody} 
                  variant="outline"
                  disabled={isPlaying || isProcessingAudio || isCadencePlaying}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  New Melody
                </Button>
              )}
            </div>
            {submitted && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">Score: {score}/{results.length}</span>
                {!showAnswers && (
                  <Button 
                    onClick={handleShowAnswers} 
                    variant="outline" 
                    size="sm"
                    disabled={isProcessingAudio || isCadencePlaying}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Show Answers
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {isCadencePlaying && (
            <div className="flex justify-center items-center p-4 bg-yellow-50 rounded-md">
              <p className="text-lg font-medium">Playing cadence in {keySignature} Major...</p>
            </div>
          )}
          
          {isCadencePlaying && (
            <div className="hidden">
              <CadencePlayer 
                musicalKey={keySignature}
                bpm={config.bpm || 120}
                pianoInstrument={pianoRef.current}
                onCadenceComplete={handleCadenceComplete}
                autoPlay={true}
              />
            </div>
          )}
          
          {melody && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 md:grid-cols-8">
                {Array.from({ length: userAnswers.length }).map((_, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="text-sm text-center mb-1">Note {index + 1}</div>
                    {renderInputField(index)}
                    {submitted && !showAnswers && (
                      <div className="mt-1">
                        {results[index] ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <Piano 
                keyId={keySignature} 
                activeDegrees={getDegreeNotes()}
                onKeyPress={handlePianoKeyPress}
                disabled={showAnswers || isProcessingAudio || isCadencePlaying}
              />
              
              <div className="flex justify-between mt-4">
                {!submitted ? (
                  <Button 
                    onClick={validateAnswers} 
                    disabled={userAnswers.some(a => !a.trim()) || isProcessingAudio || isCadencePlaying}
                  >
                    Submit Answers
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNextMelody} 
                    variant="default"
                    disabled={isProcessingAudio || isCadencePlaying}
                  >
                    <SkipForward className="mr-2 h-4 w-4" />
                    Next
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MelodyTester;
"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, HelpCircle, Brain, Play, Square, Repeat, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import * as Tone from 'tone';
import { playSequence } from '@/lib/melodyGenerators';

interface MelodyTesterProps {
  melody: {
    notes: string[];
    fullSequence: any[];
  } | null;
  onGenerateNew: () => void;
  keySignature?: string;
  config?: any;
}

const MelodyTester: React.FC<MelodyTesterProps> = ({ 
  melody, 
  onGenerateNew, 
  keySignature = "C",
  config = {} 
}) => {
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null);
  const [loopEnabled, setLoopEnabled] = useState(false);
  
  const melodyPlayerRef = useRef<any>(null);
  const currentMelodyRef = useRef<any>(null);

  useEffect(() => {
    if (melody) {
      currentMelodyRef.current = melody;
      const noteCount = melody.fullSequence.filter(item => item.type === "note").length;
      setUserAnswers(Array(noteCount).fill(""));
      setResults(Array(noteCount).fill(false));
      setShowAnswers(false);
      setScore(0);
      setSubmitted(false);
      setCurrentNoteIndex(null);
    }
    
    return () => {
      if (melodyPlayerRef.current) {
        melodyPlayerRef.current.stop();
      }
    };
  }, [melody]);

  const generateMelody = async () => {
    if (isPlaying && melodyPlayerRef.current) {
      melodyPlayerRef.current.stop();
      setIsPlaying(false);
      setCurrentNoteIndex(null);
    }
    
    try {
      // Call the parent component's onGenerateNew function to generate a new melody
      onGenerateNew();
      
      // Reset the user interface
      setUserAnswers([]);
      setResults([]);
      setShowAnswers(false);
      setScore(0);
      setSubmitted(false);
    } catch (error) {
      console.error("Error generating melody:", error);
    }
  };

  const handlePlayMelody = async () => {
    if (!melody) return;
    
    if (isPlaying && melodyPlayerRef.current) {
      melodyPlayerRef.current.stop();
      setIsPlaying(false);
      setCurrentNoteIndex(null);
      return;
    }
    
    try {
      // Merge current melody's notes with config
      const playConfig = {
        ...config,
        notes: melody.notes,
        loop: loopEnabled
      };
      
      melodyPlayerRef.current = await playSequence(playConfig);
      
      // Set up note tracking for visualization
      let noteIndex = 0;
      melodyPlayerRef.current.onNotePlay = (time, note) => {
        Tone.Transport.scheduleOnce(() => {
          setCurrentNoteIndex(noteIndex);
          noteIndex = (noteIndex + 1) % melody.notes.length;
        }, time);
      };
      
      melodyPlayerRef.current.onStop = () => {
        setIsPlaying(false);
        setCurrentNoteIndex(null);
      };
      
      melodyPlayerRef.current.play();
      setIsPlaying(true);
      
      // If not looping, set a timeout to update the isPlaying state
      if (!loopEnabled) {
        const totalDuration = melody.fullSequence.reduce(
          (total, item) => total + (item.value || 0), 
          0
        ) * (60 / (config.bpm || 120)) * 1000;
        
        setTimeout(() => {
          setIsPlaying(false);
          setCurrentNoteIndex(null);
        }, totalDuration + 500);
      }
    } catch (error) {
      console.error("Error playing melody:", error);
    }
  };

  const handleReplayMelody = async () => {
    if (melodyPlayerRef.current) {
      melodyPlayerRef.current.stop();
    }
    
    setIsPlaying(false);
    setCurrentNoteIndex(null);
    setTimeout(() => {
      handlePlayMelody();
    }, 100);
  };

  const handleInputChange = (index: number, value: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

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

  const validateAnswers = () => {
    if (!melody) return;
    
    const keyMap = buildKeyMap(keySignature);
    
    const actualNotes = melody.fullSequence
      .filter(item => item.type === "note")
      .map(item => {
        const noteWithoutOctave = item.note.replace(/\d+$/, '');
        return keyMap[noteWithoutOctave] || noteWithoutOctave;
      });
    
    const newResults = userAnswers.map((answer, index) => {
      return answer.trim() === actualNotes[index];
    });

    const newScore = newResults.filter(result => result).length;
    setResults(newResults);
    setScore(newScore);
    setSubmitted(true);
  };

  const resetTest = () => {
    if (isPlaying && melodyPlayerRef.current) {
      melodyPlayerRef.current.stop();
      setIsPlaying(false);
      setCurrentNoteIndex(null);
    }
    
    onGenerateNew();
  };

  const toggleShowAnswers = () => {
    setShowAnswers(!showAnswers);
  };

  const handleLoopChange = (checked: boolean) => {
    setLoopEnabled(checked);
    if (isPlaying && melodyPlayerRef.current) {
      melodyPlayerRef.current.stop();
      setIsPlaying(false);
      setTimeout(() => {
        handlePlayMelody();
      }, 100);
    }
  };

  if (!melody) {
    return (
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2" /> Melody Tester
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            No melody available. Please generate a melody first.
          </div>
        </CardContent>
      </Card>
    );
  }

  const keyMap = buildKeyMap(keySignature);
  const noteCount = melody.fullSequence.filter(item => item.type === "note").length;

  const renderNoteDisplay = () => {
    const noteItems = melody.fullSequence
      .filter(item => item.type === "note")
      .map((item, index) => {
        const isCurrentPlaying = currentNoteIndex === index;
        const noteWithoutOctave = item.note.replace(/\d+$/, '');
        const octave = item.note.match(/\d+$/)?.[0] || '';
        
        return (
          <div 
            key={`note-${index}`} 
            className={`transition-all duration-150 h-10 w-10 flex items-center justify-center rounded-md
              ${isCurrentPlaying ? 'bg-primary text-white scale-110 shadow-md' : 'bg-primary/10'}`}
          >
            <div className="text-center">
              <span className="font-bold">{noteWithoutOctave}</span>
              <span className="text-xs">{octave}</span>
            </div>
          </div>
        );
      });
    
    return (
      <div className="flex justify-center gap-2 mb-4 overflow-x-auto py-2">
        {noteItems}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2" /> Melody Tester
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-primary/5 p-4 rounded-md">
            <h3 className="font-medium mb-2">Instructions:</h3>
            <p className="text-sm text-muted-foreground">
              Listen to the melody and enter the scale degrees in {keySignature} major. 
              Use numbers 1-7 with # for sharps when needed (e.g. 1, 4, 5#).
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Button 
                onClick={handlePlayMelody} 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
              >
                {isPlaying ? (
                  <>
                    <Square className="h-4 w-4" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Play
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleReplayMelody} 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                disabled={isPlaying}
              >
                <Repeat className="h-4 w-4" /> Replay
              </Button>
              
              <div className="flex items-center gap-2 ml-auto">
                <Switch
                  id="loop-mode"
                  checked={loopEnabled}
                  onCheckedChange={handleLoopChange}
                />
                <Label htmlFor="loop-mode">Loop</Label>
              </div>
            </div>
          </div>

          {renderNoteDisplay()}

          <div className="flex flex-wrap gap-2">
            {melody.fullSequence
              .filter(item => item.type === "note")
              .map((item, index) => {
                const isCorrect = results[index];
                const hasAnswered = submitted && userAnswers[index] !== "";
                const noteWithoutOctave = item.note.replace(/\d+$/, '');
                const actualAnswer = keyMap[noteWithoutOctave] || noteWithoutOctave;
                const isCurrentlyPlaying = currentNoteIndex === index;
                
                return (
                  <div key={`input-${index}`} className="flex items-center">
                    <Input
                      className={`w-16 transition-all duration-200 ${
                        isCurrentlyPlaying 
                          ? "ring-2 ring-primary shadow-md transform scale-110" 
                          : ""
                      }`}
                      placeholder="1, 5#..."
                      value={userAnswers[index] || ""}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      disabled={submitted}
                      maxLength={3}
                    />
                    {submitted && (
                      <div className="flex items-center ml-1">
                        {hasAnswered ? (
                          isCorrect ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )
                        ) : (
                          <HelpCircle className="h-4 w-4 text-amber-500" />
                        )}
                        {(showAnswers || isCorrect) && !isCorrect && (
                          <span className="ml-1 text-xs">
                            {actualAnswer}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-2">
              {submitted && (
                <Button
                  variant="outline"
                  onClick={toggleShowAnswers}
                  className="flex-grow"
                >
                  {showAnswers ? "Hide Answers" : "Show Answers"}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={resetTest}
                className="flex-grow"
              >
                <RefreshCw className="h-4 w-4 mr-1" /> New Melody
              </Button>
              <Button 
                onClick={generateMelody} 
                variant="outline" 
                className="flex-grow"
              >
                Generate New
              </Button>
            </div>
            
            {!submitted ? (
              <Button 
                onClick={validateAnswers}
                className="flex-grow"
                disabled={userAnswers.every(answer => answer === "")}
              >
                Check Answers
              </Button>
            ) : (
              <div className="bg-primary/10 p-3 rounded-md flex items-center justify-center">
                <span className="font-medium">Score: {score}/{noteCount}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  ({Math.round((score / noteCount) * 100)}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MelodyTester;
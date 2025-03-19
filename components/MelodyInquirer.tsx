"use client"
import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { MelodyConfigParams } from './MelodyConfig';
import { playSequence } from '@/lib/melodyGenerators';

export const getDegreeFromNote = (note, keyId) => {
  const chromaticNotes = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
  ];
  const noteName = note.replace(/\d+$/, '');
  const keyIndex = chromaticNotes.indexOf(keyId);
  const noteIndex = chromaticNotes.indexOf(noteName);
  if (keyIndex === -1 || noteIndex === -1) {
    return "?";
  }
  let degreeIndex = (noteIndex - keyIndex + 12) % 12;
  let degree;
  switch (degreeIndex) {
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
  return degree;
};

export interface MelodyInquirerRef {
  generateMelody: () => Promise<void>;
  playMelody: () => void;
}

interface MelodyInquirerProps {
  config: MelodyConfigParams;
  onConfigChange?: (field: keyof MelodyConfigParams, value: any) => void;
  onMelodyChange?: (melody: any) => void;
}

interface MelodyInstance {
  play: () => void;
  stop: () => void;
  isPlaying: boolean;
  sequence: string[];
}

const MelodyInquirer = forwardRef<MelodyInquirerRef, MelodyInquirerProps>(
  ({ config, onConfigChange, onMelodyChange }, ref) => {
    const [melody, setMelody] = useState<MelodyInstance | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [generatedSequence, setGeneratedSequence] = useState<string[]>([]);
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<boolean[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [currentNote, setCurrentNote] = useState<number>(-1);
    const [hideNotes, setHideNotes] = useState(true);
    const [fullSequence, setFullSequence] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const melodyRef = useRef<MelodyInstance | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const generateMelody = async () => {
      if (melodyRef.current && melodyRef.current.isPlaying) {
        melodyRef.current.stop();
      }

      try {
        const newMelody = await playSequence(config);
        melodyRef.current = newMelody;
        setMelody(newMelody);
        setIsPlaying(false);
        setGeneratedSequence(newMelody.sequence || []);
        setCurrentQuestionIndex(0);
        
        resetUserAnswers(newMelody.sequence?.length || 0);
        setShowFeedback(false);
        
        if (onMelodyChange) {
          onMelodyChange(newMelody);
        }
      } catch (error) {
        console.error("Error generating melody:", error);
      }
    };

    const resetUserAnswers = (length: number) => {
      setUserAnswers(Array(length).fill(''));
      setFeedback(Array(length).fill(false));
      inputRefs.current = Array(length).fill(null);
    };

    useImperativeHandle(ref, () => ({
      generateMelody,
      playMelody: () => {
        if (melodyRef.current && !isPlaying) {
          melodyRef.current.play();
          setIsPlaying(true);
          animateNotes();
        }
      }
    }));

    const animateNotes = () => {
      if (!generatedSequence.length) return;
      
      setCurrentNote(0);
      let noteIndex = 0;
      
      const animationInterval = setInterval(() => {
        noteIndex++;
        if (noteIndex >= generatedSequence.length) {
          clearInterval(animationInterval);
          setCurrentNote(-1);
        } else {
          setCurrentNote(noteIndex);
        }
      }, (60000 / config.bpm) * 2); // Adjust timing based on BPM
      
      return () => clearInterval(animationInterval);
    };

    useEffect(() => {
      generateMelody();
      return () => {
        if (melodyRef.current) {
          melodyRef.current.stop();
        }
      };
    }, [config]);

    useEffect(() => {
      if (currentNote === currentQuestionIndex && currentNote !== -1) {
        const inputElement = inputRefs.current[currentQuestionIndex];
        if (inputElement) {
          inputElement.focus();
        }
      }
    }, [currentNote, currentQuestionIndex]);

    const handlePlayClick = () => {
      if (!melody) return;
      
      if (isPlaying) {
        melody.stop();
        setIsPlaying(false);
      } else {
        melody.play();
        setIsPlaying(true);
        animateNotes();
      }
    };

    const resetGame = () => {
      generateMelody();
    };

    const updateUserAnswer = (index: number, value: string) => {
      const newAnswers = [...userAnswers];
      newAnswers[index] = value;
      setUserAnswers(newAnswers);
    };

    const nextQuestion = () => {
      if (currentQuestionIndex < generatedSequence.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        const inputElement = inputRefs.current[currentQuestionIndex + 1];
        if (inputElement) {
          inputElement.focus();
        }
      }
    };

    const checkAnswers = () => {
      const results = userAnswers.map((answer, index) => {
        const correctNote = generatedSequence[index];
        const correctDegree = getDegreeFromNote(correctNote, config.keyId);
        return answer.trim() === correctDegree.trim();
      });
      
      setFeedback(results);
      setShowFeedback(true);
    };

    const handleLoopToggle = (checked: boolean) => {
      if (onConfigChange) {
        onConfigChange('loop', checked);
      }
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
            onClick={resetGame}
            className="px-4 py-2 rounded-lg font-medium text-white bg-gray-500 hover:bg-gray-600"
          >
            New Melody
          </button>
        </div>

        {config.allowRests && (
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
          <div className="text-sm font-medium mb-2">Enter scale degrees (1-7):</div>
          <div className="flex flex-wrap gap-2">
            {generatedSequence.map((_, index) => (
              <div 
                key={index} 
                className={`relative flex items-center ${
                  currentQuestionIndex === index ? "border-2 border-blue-500" : ""
                }`}
              >
                <input
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  value={userAnswers[index]}
                  onChange={(e) => updateUserAnswer(index, e.target.value)}
                  className={`px-3 py-1 w-12 h-10 text-center rounded-md ${
                    currentNote === index && isPlaying 
                      ? "bg-green-100 border-2 border-green-500" 
                      : showFeedback
                        ? feedback[index]
                          ? "bg-green-100 border border-green-500"
                          : "bg-red-100 border border-red-500"
                        : "bg-gray-100 border border-gray-300"
                  }`}
                  disabled={showFeedback}
                  placeholder={`${index + 1}`}
                />
                {currentNote === index && isPlaying && (
                  <div className="absolute bottom-full left-0 w-full h-1 bg-green-500 animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex w-full space-x-4">
          <button 
            onClick={nextQuestion}
            className="px-4 py-2 rounded-lg font-medium text-white bg-blue-500 hover:bg-blue-600"
            disabled={currentQuestionIndex >= generatedSequence.length - 1 || showFeedback}
          >
            Next Note
          </button>
          
          <button 
            onClick={checkAnswers}
            className="px-4 py-2 rounded-lg font-medium text-white bg-yellow-500 hover:bg-yellow-600"
            disabled={userAnswers.some(answer => answer === '') || showFeedback}
          >
            Check Answers
          </button>
        </div>
  
        {showFeedback && (
          <div className="w-full mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-medium mb-2">Results:</div>
            <div className="flex flex-col space-y-2">
              {feedback.map((result, index) => {
                const correctNote = generatedSequence[index];
                const correctDegree = getDegreeFromNote(correctNote, config.keyId);
                return (
                  <div 
                    key={index} 
                    className={`px-3 py-2 rounded-md ${result ? "bg-green-100" : "bg-red-100"}`}
                  >
                    {result ? (
                      <>
                        <span className="font-medium">Correct!</span> Note {index + 1} is degree {correctDegree}.
                      </>
                    ) : (
                      <>
                        <span className="font-medium">Incorrect.</span> You entered {userAnswers[index]}, but Note {index + 1} is degree {correctDegree}.
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
);

MelodyInquirer.displayName = "MelodyInquirer";

export default MelodyInquirer;
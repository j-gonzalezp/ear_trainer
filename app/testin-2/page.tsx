"use client"
import React, { useState, useEffect, useRef } from 'react';
import MelodyConfig, { MelodyConfigParams } from '../../components/MelodyConfig';
import MelodyTester from '../../components/MelodyTester';
import { ChevronUp, ChevronDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPiano, createMetronome, generateNoteSequence, rhythmGenerator, createFullSequence } from '@/lib/melodyGenerators';

const defaultConfig: MelodyConfigParams = {
  keyId: "C",
  notes: ["1", "2", "3", "4", "5", "6", "7"],
  range: ["C3", "C5"],
  numberOfNotes: 5,
  maxInterval: 5,
  minInterval: 1,
  totalBeats: 4,
  shortestDuration: "8n",
  longestDuration: "4n",
  allowRests: false,
  restProbability: 0.2,
  loop: false,
  bpm: 90
};

const ColoredInputWrapper = ({ value, onChange, isCorrect, isSubmitted, isCurrentlyPlaying, disabled, actualAnswer, showAnswer, className, maxLength, ref, onFocus }) => {
  let borderColorClass = "";
  let bgColorClass = "";
  
  if (isSubmitted) {
    if (isCorrect) {
      borderColorClass = "border-green-500";
      bgColorClass = "bg-green-50";
    } else {
      borderColorClass = "border-red-500";
      bgColorClass = "bg-red-50";
    }
  }
  
  const playingClass = isCurrentlyPlaying ? "ring-2 ring-primary shadow-md transform scale-110" : "";
  
  return (
    <div className="relative">
      <input
        ref={ref}
        className={`w-16 h-10 text-center rounded-md border transition-all duration-200 ${borderColorClass} ${bgColorClass} ${playingClass} ${className}`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength || 3}
        onFocus={onFocus}
      />
      {isSubmitted && !isCorrect && showAnswer && (
        <div className="absolute -bottom-5 left-0 text-xs text-center w-full text-green-500 font-medium">
          {actualAnswer}
        </div>
      )}
    </div>
  );
};

const MelodyTrainingPage = () => {
  const [config, setConfig] = useState<MelodyConfigParams>(defaultConfig);
  const [melody, setMelody] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const pianoRef = useRef(null);
  const metronomeRef = useRef(null);
  
  useEffect(() => {
    if (!pianoRef.current) {
      pianoRef.current = createPiano();
    }
    
    if (!metronomeRef.current) {
      metronomeRef.current = createMetronome();
    }
  }, []);
  
  const handleConfigChange = (field: keyof MelodyConfigParams, value: any) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [field]: value
    }));
  };
  
  const handleGenerateMelody = () => {
    try {
      const generatedNotes = generateNoteSequence({
        keyId: config.keyId,
        notes: config.notes,
        range: config.range,
        numberOfNotes: config.numberOfNotes,
        maxInterval: config.maxInterval,
        minInterval: config.minInterval
      });
      
      const rhythmPattern = rhythmGenerator({
        totalBeats: config.totalBeats,
        shortestDuration: config.shortestDuration,
        longestDuration: config.longestDuration,
        n: config.numberOfNotes,
        allowRests: config.allowRests,
        restProbability: config.restProbability
      });
      
      const fullSequence = createFullSequence(generatedNotes, rhythmPattern);
      
      const melodyNotes = fullSequence
        .filter(item => item.type === "note")
        .map(item => item.note);
      
      setMelody({
        notes: melodyNotes,
        fullSequence: fullSequence
      });
    } catch (error) {
      console.error("Error generating melody:", error);
    }
  };
  
  useEffect(() => {
    handleGenerateMelody();
  }, []);
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Ear Training App</h1>
      
      <div className="mb-6">
        <MelodyTester 
          melody={melody}
          onGenerateNew={handleGenerateMelody}
          keySignature={config.keyId}
          config={{
            bpm: config.bpm,
            loop: config.loop,
            notes: config.notes
          }}
          InputComponent={props => (
            <ColoredInputWrapper
              {...props}
              isSubmitted={props.isSubmitted}
              isCorrect={props.isCorrect}
              isCurrentlyPlaying={props.isCurrentlyPlaying}
              showAnswer={props.showAnswer}
              actualAnswer={props.actualAnswer}
              onFocus={props.onFocus}
            />
          )}
        />
      </div>
      
      <div className="space-y-4">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
          onClick={() => setShowConfig(!showConfig)}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
          {showConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        
        {showConfig && (
          <div className="border rounded-lg p-4 bg-slate-50">
            <MelodyConfig 
              config={config}
              onChange={handleConfigChange}
              hideGenerateButton={true}
            />
            <div className="mt-4 flex justify-center">
              <Button onClick={handleGenerateMelody}>
                Apply Settings & Generate New Melody
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MelodyTrainingPage;
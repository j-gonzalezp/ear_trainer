"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Sliders } from "lucide-react";
import MelodyConfig, { MelodyConfigParams } from '@/components/MelodyConfig';
import MelodyTester from '@/components/MelodyTester';
import { generateMelodySequence } from '@/lib/melodyGenerators';

export default function MelodyGeneratorPage() {
  const [config, setConfig] = useState<MelodyConfigParams>({
    keyId: "C",
    notes: ["1", "2", "3", "4", "5", "6", "7"],
    range: ["C3", "C5"],
    numberOfNotes: 8,
    maxInterval: 12,
    minInterval: 1,
    totalBeats: 4,
    shortestDuration: "8n",
    longestDuration: "2n",
    allowRests: true,
    restProbability: 0.2,
    loop: false,
    bpm: 120
  });
  
  const [showConfig, setShowConfig] = useState(false);
  const [currentMelody, setCurrentMelody] = useState<{
    notes: string[];
    fullSequence: any[];
  } | null>(null);
  
  const handleConfigChange = (field: keyof MelodyConfigParams, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };
  
  const toggleConfig = () => {
    setShowConfig(!showConfig);
  };

  const generateNewMelody = async () => {
    try {
      // Assuming generateMelodySequence returns the data in the format needed by MelodyTester
      const result = await generateMelodySequence(config);
      setCurrentMelody(result);
    } catch (error) {
      console.error("Error generating melody:", error);
    }
  };

  // Generate initial melody on component mount and when config changes
  useEffect(() => {
    generateNewMelody();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Melody Generator</h1>
        <p className="text-muted-foreground">
          Create, play, and test your ear with custom melodies
        </p>
      </header>

      <div className="space-y-8">
        <div className="w-full flex justify-center">
          <MelodyTester 
            melody={currentMelody}
            onGenerateNew={generateNewMelody}
            keySignature={config.keyId}
            config={config}
          />
        </div>
        
        <div className="flex justify-center">
          <Button 
            onClick={toggleConfig} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Sliders className="h-4 w-4" />
            {showConfig ? "Hide Configuration" : "Show Configuration"}
            {showConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {showConfig && (
          <div className="flex justify-center">
            <MelodyConfig 
              config={config} 
              onChange={handleConfigChange} 
              onGenerateNew={generateNewMelody}
              hideGenerateButton={false}
            />
          </div>
        )}
      </div>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>Adjust melody parameters, play the melody, and test your ear by guessing the notes.</p>
      </footer>
    </div>
  );
}
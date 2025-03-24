"use client"
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import MelodyTester from '@/components/MelodyTester';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function LevelPage() {
  const params = useParams();
  const level = parseInt(params.level, 10);
  
  const [melody, setMelody] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(1);
  const [loop, setLoop] = useState(false);
  
  const totalGroups = calculateTotalGroups(level);
  
  const exerciseParams = {
    1: {
      numberOfNotes: 5,
      maxInterval: 12,
      minInterval: 1,
      totalBeats: 2,
      bpm: 200
    },
    2: {
      numberOfNotes: 3,
      maxInterval: 3,
      minInterval: 1,
      totalBeats: 3,
      bpm: 200
    },
    3: {
      numberOfNotes: 4,
      maxInterval: 4,
      minInterval: 1,
      totalBeats: 4,
      bpm: 200
    },
    4: {
      numberOfNotes: 5,
      maxInterval: 5,
      minInterval: 1,
      totalBeats: 5,
      bpm: 200
    },
    5: {
      numberOfNotes: 6,
      maxInterval: 6,
      minInterval: 1,
      totalBeats: 6,
      bpm: 200
    },
    6: {
      numberOfNotes: 7,
      maxInterval: 7,
      minInterval: 1,
      totalBeats: 7,
      bpm: 200
    }
  }[level] || {
    numberOfNotes: 2,
    maxInterval: 2,
    minInterval: 1,
    totalBeats: 2,
    bpm: 200
  };
  
  const availableNotes = getAvailableNotes(level, currentGroup, totalGroups);
  
  useEffect(() => {
    generateNewMelody();
  }, [currentGroup, level]);
  
  function calculateTotalGroups(level) {
    const n = 7;
    const r = Math.min(level + 1, 7);
    
    return factorial(n) / (factorial(r) * factorial(n - r));
  }
  
  function factorial(num) {
    if (num <= 1) return 1;
    return num * factorial(num - 1);
  }
  
  function getAvailableNotes(level, group, totalGroups) {
    const allNotes = ["1", "2", "3", "4", "5", "6", "7"];
    const notesToUse = level + 1;
    
    const startIndex = (group - 1) % (8 - notesToUse);
    const result = allNotes.slice(startIndex, startIndex + notesToUse);
    
    if (result.length < notesToUse) {
      const remaining = notesToUse - result.length;
      result.push(...allNotes.slice(0, remaining));
    }
    
    return result;
  }

  function getRandomNote(notes) {
    const randomIndex = Math.floor(Math.random() * notes.length);
    return notes[randomIndex];
  }

  function generateNewMelody() {
    const sequenceLength = exerciseParams.numberOfNotes;
    const randomSequence = [];
    
    for (let i = 0; i < sequenceLength; i++) {
      const randomNote = getRandomNote(availableNotes);
      randomSequence.push(randomNote);
    }
    
    const fullSequence = randomSequence.map((note, index) => ({
      type: "note",
      note: translateNoteToRealNote(note, "C"),
      value: 0.5,
      position: index
    }));
    
    const mockMelody = {
      notes: availableNotes,
      fullSequence: fullSequence
    };
    
    setMelody(mockMelody);
  }
  
  function translateNoteToRealNote(note, key) {
    const noteMap = {
      "1": "C4",
      "2": "D4",
      "3": "E4",
      "4": "F4",
      "5": "G4",
      "6": "A4",
      "7": "B4"
    };
    
    return noteMap[note] || "C4";
  }
  
  function handleNextGroup() {
    if (currentGroup < totalGroups) {
      setCurrentGroup(currentGroup + 1);
    } else {
      setCurrentGroup(1);
    }
  }
  
  function handlePreviousGroup() {
    if (currentGroup > 1) {
      setCurrentGroup(currentGroup - 1);
    } else {
      setCurrentGroup(totalGroups);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <header className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/melodies">
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Nivel {level} - Grupo {currentGroup}/{totalGroups}</h1>
          </div>
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Notas disponibles:</h3>
                  <div className="flex gap-2">
                    {availableNotes.map(note => (
                      <div key={note} className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Parámetros:</h3>
                  <p>Notas: {exerciseParams.numberOfNotes}</p>
                  <p>Tempo: {exerciseParams.bpm} BPM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </header>
        
        <MelodyTester
          melody={melody}
          onGenerateNew={generateNewMelody}
          keyId="C"
          notes={availableNotes}
          range={["C3", "C5"]}
          numberOfNotes={exerciseParams.numberOfNotes}
          maxInterval={exerciseParams.maxInterval}
          minInterval={exerciseParams.minInterval}
          totalBeats={exerciseParams.totalBeats}
          shortestDuration="8n"
          longestDuration="4n"
          allowRests={false}
          restProbability={0}
          loop={loop}
          bpm={exerciseParams.bpm}
          onLoopChange={setLoop}
        />
        
        <div className="flex justify-between mt-8">
          <Button onClick={handlePreviousGroup} variant="outline">
            Grupo anterior
          </Button>
          <Button onClick={generateNewMelody} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Nueva melodía
          </Button>
          <Button onClick={handleNextGroup} variant="outline">
            Siguiente grupo
          </Button>
        </div>
      </div>
    </div>
  );
}
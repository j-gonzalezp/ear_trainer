"use client"
import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Repeat, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MelodyConfigParams } from './MelodyConfig';
import { playSequence } from '@/lib/melodyGenerators';

interface MelodyPlayerProps {
  config: MelodyConfigParams;
  onConfigChange?: (field: keyof MelodyConfigParams, value: any) => void;
  onMelodyChange?: (melody: MelodyInstance | null) => void;
}

interface MelodyInstance {
  notes: string[];
  durations: string[];
  fullSequence: any[];
  play: () => void;
  stop: () => void;
  isPlaying: boolean;
}

// Create a ref type for external use
export interface MelodyPlayerRef {
  generateMelody: () => Promise<void>;
  playMelody: () => void;
}

const MelodyPlayer = forwardRef<MelodyPlayerRef, MelodyPlayerProps>(
  ({ config, onConfigChange, onMelodyChange }, ref) => {
    const [melody, setMelody] = useState<MelodyInstance | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const melodyRef = useRef<MelodyInstance | null>(null);

    const generateMelody = async () => {
      if (melodyRef.current && melodyRef.current.isPlaying) {
        melodyRef.current.stop();
      }

      try {
        const newMelody = await playSequence(config);
        melodyRef.current = newMelody;
        setMelody(newMelody);
        setIsPlaying(false);
        
        if (onMelodyChange) {
          onMelodyChange(newMelody);
        }
      } catch (error) {
        console.error("Error generating melody:", error);
      }
    };

    useImperativeHandle(ref, () => ({
      generateMelody,
      playMelody: () => {
        if (melodyRef.current && !isPlaying) {
          melodyRef.current.play();
          setIsPlaying(true);
        }
      }
    }));

    useEffect(() => {
      generateMelody();
      return () => {
        if (melodyRef.current) {
          melodyRef.current.stop();
        }
      };
    }, [config]);

    const handlePlay = () => {
      if (!melody) return;
      
      if (isPlaying) {
        melody.stop();
        setIsPlaying(false);
      } else {
        melody.play();
        setIsPlaying(true);
      }
    };

    const handleLoopToggle = (checked: boolean) => {
      if (onConfigChange) {
        onConfigChange('loop', checked);
      }
    };

    const renderNote = (note: string, index: number) => {
      const noteName = note.replace(/\d+$/, '');
      const octave = note.match(/\d+$/) ? note.match(/\d+$/)![0] : '';

      return (
        <div key={`note-${index}`} className="flex flex-col items-center">
          <Badge variant="outline" className="mb-1">
            {index + 1}
          </Badge>
          <div className="h-12 w-12 bg-primary/10 rounded-md flex items-center justify-center">
            <div className="text-center">
              <span className="font-bold">{noteName}</span>
              <span className="text-xs">{octave}</span>
            </div>
          </div>
          {melody?.fullSequence[index]?.duration && (
            <span className="text-xs mt-1 text-muted-foreground">
              {melody.fullSequence[index].duration}
            </span>
          )}
        </div>
      );
    };

    const renderRest = (index: number) => {
      return (
        <div key={`rest-${index}`} className="flex flex-col items-center">
          <Badge variant="outline" className="mb-1">
            R
          </Badge>
          <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
            <span className="text-muted-foreground">rest</span>
          </div>
          {melody?.fullSequence[index]?.duration && (
            <span className="text-xs mt-1 text-muted-foreground">
              {melody.fullSequence[index].duration}
            </span>
          )}
        </div>
      );
    };

    return (
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Music className="mr-2" /> Melody Player
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Switch 
                id="loop-toggle" 
                checked={config.loop} 
                onCheckedChange={handleLoopToggle}
              />
              <Label htmlFor="loop-toggle" className="flex items-center">
                <Repeat className="w-4 h-4 mr-1" /> Loop
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Key: {config.keyId}</Badge>
              <Badge variant="secondary">Notes: {config.numberOfNotes}</Badge>
              <Badge variant="secondary">BPM: {config.bpm}</Badge>
              <Badge variant="secondary">Beats: {config.totalBeats}</Badge>
            </div>

            <div className="overflow-x-auto py-4">
              <div className="flex space-x-2 min-w-max">
                {melody?.fullSequence?.map((item, index) => (
                  item.type === "note" ? renderNote(item.note, index) : renderRest(index)
                ))}
                {!melody?.fullSequence?.length && (
                  <div className="flex items-center justify-center w-full h-20 text-muted-foreground">
                    No melody generated yet
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                onClick={handlePlay} 
                size="lg"
                className="w-32"
                variant={isPlaying ? "destructive" : "default"}
                disabled={!melody}
              >
                {isPlaying ? (
                  <><Square className="mr-2" /> Stop</>
                ) : (
                  <><Play className="mr-2" /> Play</>
                )}
              </Button>
              
              <Button onClick={generateMelody} variant="outline" size="lg" className="generate-melody-btn">
                Generate New
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

MelodyPlayer.displayName = "MelodyPlayer";

export default MelodyPlayer;
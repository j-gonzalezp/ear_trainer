"use client"
import React,  from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
;

export interface MelodyConfigParams {
  keyId: string;
  notes: string[];
  range: [string, string];
  numberOfNotes: number;
  maxInterval: number;
  minInterval: number;
  totalBeats: number;
  shortestDuration: string;
  longestDuration: string;
  allowRests: boolean;
  restProbability: number;
  loop: boolean;
  bpm: number;
}

interface MelodyConfigProps {
  config: MelodyConfigParams;
  onChange: (field: keyof MelodyConfigParams, value: any) => void;
  onGenerate?: (config: MelodyConfigParams) => void;
  hideGenerateButton?: boolean;
}

const MelodyConfig: React.FC<MelodyConfigProps> = ({ 
  config, 
  onChange, 
  onGenerate, 
  hideGenerateButton = false 
}) => {
  const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const durations = ["32n", "16n", "8n", "4n", "2n", "1n"];
  
  const handleNotesInput = (input: string) => {
    const noteArray = input.split(',').map(note => note.trim());
    onChange('notes', noteArray);
  };
  
  const handleRangeChange = (index: 0 | 1, value: string) => {
    const newRange = [...config.range] as [string, string];
    newRange[index] = value;
    onChange('range', newRange);
  };
  
  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Melody Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="keyId">Key</Label>
          <Select value={config.keyId} onValueChange={(value) => onChange('keyId', value)}>
            <SelectTrigger id="keyId" className="w-full">
              <SelectValue placeholder="Select a key" />
            </SelectTrigger>
            <SelectContent>
              {keys.map((key) => (
                <SelectItem key={key} value={key}>{key}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (comma-separated degrees or notes)</Label>
          <Input 
            id="notes" 
            value={config.notes.join(', ')} 
            onChange={(e) => handleNotesInput(e.target.value)}
            placeholder="1, 2, 3, 4, 5, 6, 7"
          />
          <div className="text-sm text-muted-foreground">
            Use scale degrees (1, 2, 3...) or note names (C, D, E...)
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rangeStart">Range Start</Label>
            <Input 
              id="rangeStart" 
              value={config.range[0]} 
              onChange={(e) => handleRangeChange(0, e.target.value)}
              placeholder="C3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rangeEnd">Range End</Label>
            <Input 
              id="rangeEnd" 
              value={config.range[1]} 
              onChange={(e) => handleRangeChange(1, e.target.value)}
              placeholder="C5"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="numberOfNotes">Number of Notes: {config.numberOfNotes}</Label>
          </div>
          <Slider 
            id="numberOfNotes"
            min={1}
            max={16}
            step={1}
            value={[config.numberOfNotes]}
            onValueChange={(value) => onChange('numberOfNotes', value[0])}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="minInterval">Min Interval: {config.minInterval}</Label>
            </div>
            <Slider 
              id="minInterval"
              min={1}
              max={12}
              step={1}
              value={[config.minInterval]}
              onValueChange={(value) => onChange('minInterval', value[0])}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="maxInterval">Max Interval: {config.maxInterval}</Label>
            </div>
            <Slider 
              id="maxInterval"
              min={1}
              max={24}
              step={1}
              value={[config.maxInterval]}
              onValueChange={(value) => onChange('maxInterval', value[0])}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Rhythm Settings</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="totalBeats">Total Beats: {config.totalBeats}</Label>
            </div>
            <Slider 
              id="totalBeats"
              min={1}
              max={8}
              step={1}
              value={[config.totalBeats]}
              onValueChange={(value) => onChange('totalBeats', value[0])}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shortestDuration">Shortest Duration</Label>
              <Select value={config.shortestDuration} onValueChange={(value) => onChange('shortestDuration', value)}>
                <SelectTrigger id="shortestDuration">
                  <SelectValue placeholder="Shortest note" />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((duration) => (
                    <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="longestDuration">Longest Duration</Label>
              <Select value={config.longestDuration} onValueChange={(value) => onChange('longestDuration', value)}>
                <SelectTrigger id="longestDuration">
                  <SelectValue placeholder="Longest note" />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((duration) => (
                    <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="allowRests" 
                checked={config.allowRests} 
                onCheckedChange={(checked) => onChange('allowRests', checked)}
              />
              <Label htmlFor="allowRests">Allow Rests</Label>
            </div>
            
            {config.allowRests && (
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="restProbability">Rest Probability: {(config.restProbability * 100).toFixed(0)}%</Label>
                </div>
                <Slider 
                  id="restProbability"
                  min={0}
                  max={0.5}
                  step={0.05}
                  value={[config.restProbability]}
                  onValueChange={(value) => onChange('restProbability', value[0])}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Playback Settings</h3>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="loop" 
              checked={config.loop} 
              onCheckedChange={(checked) => onChange('loop', checked)}
            />
            <Label htmlFor="loop">Loop Playback</Label>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="bpm">Tempo (BPM): {config.bpm}</Label>
            </div>
            <Slider 
              id="bpm"
              min={40}
              max={240}
              step={1}
              value={[config.bpm]}
              onValueChange={(value) => onChange('bpm', value[0])}
            />
          </div>
        </div>
        
        {!hideGenerateButton && onGenerate && (
          <Button 
            className="w-full" 
            size="lg" 
            onClick={() => onGenerate(config)}
          >
            Generate Melody
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MelodyConfig;
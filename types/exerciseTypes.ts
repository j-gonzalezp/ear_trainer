export interface Exercise {
    keyId: number;
    userId: number;
    groupId: number;
    exerciseId: number;
    level: number;
    range: string;
    notes: string[];
    numberOfNotes: number;
    totalBeats: number;
    maxInterval: number;
    minInterval: number;
    bpm: number;
    results: number[];
    graduation: boolean;
  }
  
  export interface ExerciseResult {
    exerciseId: number;
    userId: number;
    result: number;
    timestamp?: string;
  }
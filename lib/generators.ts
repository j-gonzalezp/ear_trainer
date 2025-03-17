import { allNotes } from "./utils";

export const rhythmGenerator = ({
  totalBeats = 4,
  shortestDuration = "8n",
  longestDuration = "2n",
  n = 4, 
  allowRests = true,
  restProbability = 0.2
} = {}) => {

  const durationValues = {
    "32n": 1/8,
    "16n": 1/4,
    "8n": 1/2,
    "4n": 1,
    "2n": 2,
    "1n": 4
  };

 
  const minDuration = durationValues[shortestDuration];
  const maxDuration = durationValues[longestDuration];
  
  const result = [];
  

  let remainingBeats = totalBeats;
  let remainingNotes = n;

  const getRandomDuration = (min, max) => {

    const availableDurations = Object.entries(durationValues)
      .filter(([_, value]) => value >= min && value <= max)
      .map(([name, value]) => ({ name, value }));
    
    if (availableDurations.length === 0) {
      throw new Error(`No available durations between ${min} and ${max}`);
    }
    
   
    const randomIndex = Math.floor(Math.random() * availableDurations.length);
    return availableDurations[randomIndex];
  };
  

  const getDurationNotation = (value) => {
    for (const [notation, val] of Object.entries(durationValues)) {
      if (val === value) return notation;
    }
    return null; 
  };

  while (remainingNotes > 0) {

    const maxPossibleDuration = Math.min(
      maxDuration,
      remainingBeats - ((remainingNotes - 1) * minDuration)
    );
    
   
    if (maxPossibleDuration < minDuration) {
      console.error("Can't fit the remaining notes with the given constraints");
      break;
    }

    const canAddRest = allowRests && (remainingBeats - ((remainingNotes) * minDuration)) > 0;
    

    const isRest = canAddRest && Math.random() < restProbability;
    

    const randomDuration = getRandomDuration(minDuration, maxPossibleDuration);

    result.push({
      type: isRest ? "rest" : "note",
      duration: randomDuration.name,
      value: randomDuration.value
    });
    
 
    if (!isRest) {
      remainingNotes--;
    }
    
    remainingBeats -= randomDuration.value;
  }
  
 
  while (remainingBeats >= minDuration && allowRests) {
    const maxPossibleRestDuration = Math.min(maxDuration, remainingBeats);

    const randomDuration = getRandomDuration(minDuration, maxPossibleRestDuration);
    
    result.push({
      type: "rest",
      duration: randomDuration.name,
      value: randomDuration.value
    });
    
    remainingBeats -= randomDuration.value;
  }
  

  if (remainingBeats > 0 && remainingBeats < minDuration) {
    const lastElement = result[result.length - 1];
    const newDurationValue = lastElement.value + remainingBeats;
    
    const exactMatchDuration = getDurationNotation(newDurationValue);
    if (exactMatchDuration) {
      lastElement.duration = exactMatchDuration;
    } else {
      lastElement.duration = `~${lastElement.duration}`;
    }
    lastElement.value = newDurationValue;
    remainingBeats = 0;
  }
  
  return result;
};

export const availableNotes = ({
  allNotes,
  range,
  notes,
  keyId
}: {
  allNotes: string[];
  range: string[];
  notes: string[];
  keyId: string;
}): string[] => {
  if (!range || range.length !== 2) {
    return [];
  }

  const startIndex = allNotes.indexOf(range[0]);
  const endIndex = allNotes.indexOf(range[1]);

  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
    return [];
  }

  const notesInRange = allNotes.slice(startIndex, endIndex + 1);

  if (!notes || notes.length === 0) {
    return notesInRange;
  }

  // Define all notes in chromatic order
  const chromaticNotes: string[] = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
  ];

  // Get the index of the selected key
  const keyIndex = chromaticNotes.indexOf(keyId);
  if (keyIndex === -1) {
    return notesInRange;
  }

  // Create a map for all degrees based on the musical key
  const degreeToNoteMap: Record<string, string> = {};
  for (let i = 0; i < chromaticNotes.length; i++) {
    const noteIndex = (keyIndex + i) % chromaticNotes.length;
    const note = chromaticNotes[noteIndex];
    
    let degree;
    switch (i) {
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
    
    degreeToNoteMap[degree] = note;
  }

  // Create a reverse map from note to degree
  const noteToDegreeMap: Record<string, string> = {};
  Object.entries(degreeToNoteMap).forEach(([degree, note]) => {
    noteToDegreeMap[note] = degree;
  });

  // Filter notes in range based on the selected degrees (notes) or actual notes
  const result = notesInRange.filter(fullNote => {
    // Extract the note name without octave
    const noteName = fullNote.replace(/\d+$/, '');
    
    // Check if this note is in the selected notes array
    if (notes.includes(noteName)) {
      return true;
    }
    
    // Check if this note corresponds to any of the selected degrees
    const degree = noteToDegreeMap[noteName];
    return notes.includes(degree);
  });

  // Sort the result by key if needed
  if (keyId && keyId.length > 0) {
    // Find the key note in the filtered result set
    const keyNotes = result.filter(note => note.replace(/\d+$/, '') === keyId);
    
    if (keyNotes.length > 0) {
      // Sort the result to start with the key note (lowest octave)
      const firstKeyNote = keyNotes[0];
      const firstKeyIndex = result.indexOf(firstKeyNote);
      
      if (firstKeyIndex !== -1) {
        // Reorder array to start with the key
        const beforeKey = result.slice(0, firstKeyIndex);
        const fromKey = result.slice(firstKeyIndex);
        return [...fromKey, ...beforeKey];
      }
    }
  }

  return result;
};

// Helper function to get degree from note based on a key
export const getDegreeFromNote = (note: string, key: string): string => {
  const chromaticNotes: string[] = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
  ];
  
  // Extract the note name without octave
  const noteName = note.replace(/\d+$/, '');
  
  // Get the index of the key and note
  const keyIndex = chromaticNotes.indexOf(key);
  const noteIndex = chromaticNotes.indexOf(noteName);
  
  if (keyIndex === -1 || noteIndex === -1) {
    return "?";
  }
  
  // Calculate the degree index (0-11)
  let degreeIndex = (noteIndex - keyIndex + 12) % 12;
  
  // Convert to degree name
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

// Helper function to get note from degree based on a key
export const getNoteFromDegree = (degree: string, key: string): string => {
  const chromaticNotes: string[] = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
  ];
  
  // Get the index of the key
  const keyIndex = chromaticNotes.indexOf(key);
  if (keyIndex === -1) {
    return "?";
  }
  
  // Map degree to semitone offset
  let semitoneOffset: number;
  switch (degree) {
    case "1": semitoneOffset = 0; break;
    case "1#": semitoneOffset = 1; break;
    case "2": semitoneOffset = 2; break;
    case "2#": semitoneOffset = 3; break;
    case "3": semitoneOffset = 4; break;
    case "4": semitoneOffset = 5; break;
    case "4#": semitoneOffset = 6; break;
    case "5": semitoneOffset = 7; break;
    case "5#": semitoneOffset = 8; break;
    case "6": semitoneOffset = 9; break;
    case "6#": semitoneOffset = 10; break;
    case "7": semitoneOffset = 11; break;
    default: return "?";
  }
  
  // Calculate the note index
  const noteIndex = (keyIndex + semitoneOffset) % 12;
  return chromaticNotes[noteIndex];
};
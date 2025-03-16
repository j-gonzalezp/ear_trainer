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

  const result = notesInRange.filter(note => {
    const noteName = note.replace(/\d+$/, '');
    return notes.includes(noteName);
  });


  if (keyId && keyId.length > 0) {

    const keyIndex = result.findIndex(note => note.replace(/\d+$/, '') === keyId);
    
    if (keyIndex !== -1) {
   
      const beforeKey = result.slice(0, keyIndex);
      const fromKey = result.slice(keyIndex);
      return [...fromKey, ...beforeKey];
    }
  }

  return result;
};


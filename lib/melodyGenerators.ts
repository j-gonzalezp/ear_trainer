import { allNotes } from "./utils";
import * as Tone from "tone";

export const rhythmGenerator = ({
  totalBeats = 4,
  shortestDuration = "16n",
  longestDuration = "2n",
  n = 4,
  allowRests = true,
  restProbability = 0.2
} = {}) => {
  const durationValues = {
    "32n": 1 / 8,
    "16n": 1 / 4,
    "16n.": 3 / 8,
    "8n": 1 / 2,
    "8n.": 3 / 4,
    "4n": 1,
    "4n.": 1.5,
    "2n": 2,
    "2n.": 3,
    "1n": 4
  };

  const minDuration = durationValues[shortestDuration] || durationValues["16n"];
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

  while (remainingNotes > 0 && remainingBeats > 0) {
    const maxPossibleDuration = Math.min(
      maxDuration,
      remainingBeats / remainingNotes
    );

    if (maxPossibleDuration < minDuration) {
      const durationToUse = minDuration;
      result.push({
        type: "note",
        duration: getDurationNotation(durationToUse) || shortestDuration,
        value: durationToUse
      });
      
      remainingBeats -= durationToUse;
      remainingNotes--;
      continue;
    }

    const randomDuration = getRandomDuration(minDuration, maxPossibleDuration);

    const isRest = allowRests && Math.random() < restProbability && remainingNotes < n;

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

  if (remainingBeats > 0 && allowRests) {
    while (remainingBeats >= minDuration) {
      const maxPossibleDuration = Math.min(maxDuration, remainingBeats);
      const randomDuration = getRandomDuration(minDuration, maxPossibleDuration);

      result.push({
        type: "rest",
        duration: randomDuration.name,
        value: randomDuration.value
      });

      remainingBeats -= randomDuration.value;
    }
  }

  if (remainingBeats > 0) {
    if (result.length > 0) {
      const lastElement = result[result.length - 1];
      const newDurationValue = lastElement.value + remainingBeats;
      
      const exactMatchDuration = getDurationNotation(newDurationValue);
      if (exactMatchDuration) {
        lastElement.duration = exactMatchDuration;
      } else {
        lastElement.duration = `~${lastElement.duration}`;
      }
      
      lastElement.value = newDurationValue;
    }
  }

  return result;
};

export const availableNotes = ({
  allNotes,
  range,
  notes,
  keyId
}) => {
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

  const chromaticNotes = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
  ];

  const keyIndex = chromaticNotes.indexOf(keyId);
  if (keyIndex === -1) {
    return notesInRange;
  }

  const degreeToNoteMap = {};
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

  const noteToDegreeMap = {};
  Object.entries(degreeToNoteMap).forEach(([degree, note]) => {
    noteToDegreeMap[note] = degree;
  });

  const result = notesInRange.filter(fullNote => {
    const noteName = fullNote.replace(/\d+$/, '');

    if (notes.includes(noteName)) {
      return true;
    }

    const degree = noteToDegreeMap[noteName];
    return notes.includes(degree);
  });

  if (keyId && keyId.length > 0) {
    const keyNotes = result.filter(note => note.replace(/\d+$/, '') === keyId);

    if (keyNotes.length > 0) {
      const firstKeyNote = keyNotes[0];
      const firstKeyIndex = result.indexOf(firstKeyNote);

      if (firstKeyIndex !== -1) {
        const beforeKey = result.slice(0, firstKeyIndex);
        const fromKey = result.slice(firstKeyIndex);
        return [...fromKey, ...beforeKey];
      }
    }
  }

  return result;
};

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

export const getNoteFromDegree = (degree, keyId) => {
  const chromaticNotes = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
  ];

  const keyIndex = chromaticNotes.indexOf(keyId);
  if (keyIndex === -1) {
    return "?";
  }

  let semitoneOffset;
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

  const noteIndex = (keyIndex + semitoneOffset) % 12;
  return chromaticNotes[noteIndex];
};

export const calculateInterval = (note1, note2) => {
  const index1 = allNotes.indexOf(note1);
  const index2 = allNotes.indexOf(note2);

  if (index1 === -1 || index2 === -1) {
    throw new Error(`Invalid note: ${index1 === -1 ? note1 : note2}`);
  }

  return Math.abs(index1 - index2);
};

export const generateNoteSequence = ({
  keyId,
  notes,
  range,
  numberOfNotes,
  maxInterval,
  minInterval
}) => {
  try {
    const available = availableNotes({
      allNotes,
      range,
      notes,
      keyId: keyId || ''
    });

    if (available.length === 0) {
      return [];
    }

    const notesWithNulls = allNotes.map(note =>
      available.includes(note) ? note : null
    );

    const newSequence = [];

    const validInitialNotes = notesWithNulls.filter(note => note !== null);
    const firstNoteIndex = Math.floor(Math.random() * validInitialNotes.length);
    const firstNote = validInitialNotes[firstNoteIndex];
    newSequence.push(firstNote);

    for (let i = 1; i < numberOfNotes; i++) {
      const previousNote = newSequence[i - 1];
      const validNotes = [];

      for (let j = 0; j < notesWithNulls.length; j++) {
        const note = notesWithNulls[j];

        if (note === null) continue;

        const interval = calculateInterval(note, previousNote);

        const meetsMaxConstraint = maxInterval === undefined || interval <= maxInterval;
        const meetsMinConstraint = minInterval === undefined || interval >= minInterval;

        if (meetsMaxConstraint && meetsMinConstraint) {
          validNotes.push(note);
        }
      }

      if (validNotes.length === 0) {
        throw new Error(`No valid notes meet interval constraints from ${previousNote}`);
      }

      const nextNoteIndex = Math.floor(Math.random() * validNotes.length);
      const nextNote = validNotes[nextNoteIndex];

      if (nextNote === null || !available.includes(nextNote)) {
        throw new Error(`Selected note ${nextNote} is not in available notes!`);
      }

      newSequence.push(nextNote);
    }

    return newSequence;
  } catch (error) {
    return [];
  }
};

export const createPiano = () => {
  return new Tone.Sampler({
    urls: {
      A0: 'A0.mp3',
      C1: 'C1.mp3',
      'D#1': 'Ds1.mp3',
      'F#1': 'Fs1.mp3',
      A1: 'A1.mp3',
      C2: 'C2.mp3',
      'D#2': 'Ds2.mp3',
      'F#2': 'Fs2.mp3',
      A2: 'A2.mp3',
      C3: 'C3.mp3',
      'D#3': 'Ds3.mp3',
      'F#3': 'Fs3.mp3',
      A3: 'A3.mp3',
      C4: 'C4.mp3',
      'D#4': 'Ds4.mp3',
      'F#4': 'Fs4.mp3',
      A4: 'A4.mp3',
      C5: 'C5.mp3',
      'D#5': 'Ds5.mp3',
      'F#5': 'Fs5.mp3',
      A5: 'A5.mp3',
      C6: 'C6.mp3',
      'D#6': 'Ds6.mp3',
      'F#6': 'Fs6.mp3',
      A6: 'A6.mp3',
      C7: 'C7.mp3',
      'D#7': 'Ds7.mp3',
      'F#7': 'Fs7.mp3',
      A7: 'A7.mp3',
      C8: 'C8.mp3',
    },
    baseUrl: 'https://tonejs.github.io/audio/salamander/',
  }).toDestination();
};

export const createMetronome = () => {
  const metronomeCh = new Tone.Channel({
    volume: 10,
    pan: 1
  }).toDestination();

  const metronome = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 2,
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.001,
      decay: 0.2,
      sustain: 0.05,
      release: 0.5,
      attackCurve: "exponential"
    }
  }).connect(metronomeCh);

  const metronomeAccent = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4,
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.001,
      decay: 0.6,
      sustain: 0.1,
      release: 1.0,
      attackCurve: "exponential"
    }
  }).connect(metronomeCh);

  return { metronome, metronomeAccent };
};

export const createFullSequence = (generatedNotes, rhythmPattern) => {
  const fullSequence = [];
  let noteIndex = 0;
  let currentBeatPosition = 0;

  for (const rhythmItem of rhythmPattern) {
    if (rhythmItem.type === "note" && noteIndex < generatedNotes.length) {
      fullSequence.push({
        type: "note",
        note: generatedNotes[noteIndex],
        duration: rhythmItem.duration,
        value: rhythmItem.value,
        startTime: currentBeatPosition
      });
      noteIndex++;
    } else if (rhythmItem.type === "rest") {
      fullSequence.push({
        type: "rest",
        duration: rhythmItem.duration,
        value: rhythmItem.value,
        startTime: currentBeatPosition
      });
    }
    currentBeatPosition += rhythmItem.value;
  }

  return fullSequence;
};

export const createMetronomeEvents = (totalBeats) => {
  const events = [];
  for (let i = 0; i < totalBeats; i++) {
    events.push({
      time: i,
      note: i === 0 ? "C1" : "C3",
      velocity: i === 0 ? 1.5 : 0.8,
      isAccent: i === 0
    });
  }
  return events;
};

export const playSequence = async ({
  generatedNotes = [],
  fullSequence = [],
  piano,
  metronomeInstruments,
  loop = false,
  bpm = 120,
  onNotePlay = null
} = {}) => {
  if (Tone.context.state !== "running") {
    await Tone.start();
  }

  Tone.Transport.bpm.value = bpm;

  if (!generatedNotes || generatedNotes.length === 0 || !fullSequence || fullSequence.length === 0) {
    return { play: () => { }, stop: () => { }, isPlaying: false };
  }

  const totalBeats = fullSequence.reduce((total, item) => total + (item.value || 0), 0);

  let isPlaying = false;
  let metronomeSeq = null;
  let notesSequence = null;
  let loopCount = 0;

  const play = () => {
    if (isPlaying) return;

    if (metronomeSeq) {
      metronomeSeq.dispose();
    }
    
    if (notesSequence) {
      notesSequence.dispose();
    }

    loopCount = 0;
    isPlaying = true;

    const metronomeEvents = createMetronomeEvents(Math.ceil(totalBeats));
    metronomeSeq = new Tone.Part((time, event) => {
      if (event.isAccent) {
        metronomeInstruments.metronomeAccent.triggerAttackRelease(event.note, "32n", time, event.velocity);
      } else {
        metronomeInstruments.metronome.triggerAttackRelease(event.note, "32n", time, event.velocity);
      }
    }, metronomeEvents).start(0);
    
    metronomeSeq.loop = loop;
    metronomeSeq.loopEnd = totalBeats;

    const noteEvents = fullSequence.map(item => {
      return {
        time: item.startTime,
        item: item
      };
    });
    
    notesSequence = new Tone.Part((time, event) => {
      const item = event.item;
      
      if (item.type === "note") {
        piano.triggerAttackRelease(item.note, item.duration, time);
        if (onNotePlay) {
          const noteIndex = fullSequence.filter(item => item.type === "note")
            .findIndex(noteItem => noteItem === item);
          onNotePlay(time, item.note, noteIndex);
        }
      }
    }, noteEvents).start(0);
    
    notesSequence.loop = loop;
    notesSequence.loopEnd = totalBeats;
    
    if (loop) {
      Tone.Transport.scheduleRepeat((time) => {
        loopCount++;
      }, totalBeats);
    } else {
      Tone.Transport.scheduleOnce((time) => {
        Tone.Transport.scheduleOnce(() => {
          stop();
        }, "+0.1");
      }, totalBeats);
    }

    if (Tone.Transport.state !== "started") {
      Tone.Transport.start();
    }
  };

  const stop = () => {
    if (notesSequence) {
      notesSequence.stop();
      notesSequence.dispose();
      notesSequence = null;
    }

    if (metronomeSeq) {
      metronomeSeq.stop();
      metronomeSeq.dispose();
      metronomeSeq = null;
    }

    Tone.Transport.cancel(0);
    Tone.Transport.stop();
    isPlaying = false;
    
    if (this.onStop) {
      this.onStop();
    }
  };

  return {
    notes: generatedNotes,
    fullSequence: fullSequence,
    play,
    stop,
    onStop: null,
    get isPlaying() { return isPlaying; }
  };
};
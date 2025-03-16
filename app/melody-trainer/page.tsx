"use client";
import React, { useState, useRef, useEffect } from 'react';
import { allNotes } from '@/lib/utils';
import NoteSequencer from '@/components/noteSequencer';
import MelodyGenerator from '@/components/melodyGenerator';

interface PianoKey {
    note: string;
    isSharp: boolean;
}

const Page = () => {
    const [musicalKey, setMusicalKey] = useState<string>("C");
    const [notes, setNotes] = useState<string[]>(["C", "D", "E", "F", "G", "A", "B"]);
    const [range, setRange] = useState<[string, string]>(["C3", "C4"]);
    const [bpm, setBpm] = useState<number>(120);
    const [bpmInput, setBpmInput] = useState<string>("120");
    const [loop, setLoop] = useState<boolean>(false);
    const [rhythm, setRhythm] = useState<boolean>(false);
    const [numberOfNotes, setNumberOfNotes] = useState<number>(3);
    const [generatedSequence, setGeneratedSequence] = useState<string[]>([]);

    const [regenerationKey, setRegenerationKey] = useState<number>(0);

    const pianoKeys: PianoKey[] = [
        { note: "C", isSharp: false },
        { note: "C#", isSharp: true },
        { note: "D", isSharp: false },
        { note: "D#", isSharp: true },
        { note: "E", isSharp: false },
        { note: "F", isSharp: false },
        { note: "F#", isSharp: true },
        { note: "G", isSharp: false },
        { note: "G#", isSharp: true },
        { note: "A", isSharp: false },
        { note: "A#", isSharp: true },
        { note: "B", isSharp: false }
    ];

    const handleKeyClick = (noteKey: string) => {
        if (notes.includes(noteKey)) {
            setNotes(notes.filter(note => note !== noteKey));
        } else {
            setNotes([...notes, noteKey]);
        }
    };

    const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        setBpmInput(inputValue);
        
        const value = parseInt(inputValue);
        if (!isNaN(value) && value >= 40 && value <= 240) {
            setBpm(value);
        } else if (inputValue === '') {
            setBpm(40);
        }
    };

    const octaves = [1, 2, 3, 4, 5, 6, 7];
    const noteOptions: string[] = [];

    octaves.forEach(octave => {
        pianoKeys.forEach(key => {
            noteOptions.push(`${key.note}${octave}`);
        });
    });

    const handleSequenceGenerated = (sequence: string[]) => {
        setGeneratedSequence(sequence);
    };

    const regenerateSequence = () => {
        setRegenerationKey(prev => prev + 1);
    };

    const compareNotes = (a: string, b: string): number => {
        const noteOrder = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        const noteA = a.replace(/[0-9]/g, '');
        const octaveA = parseInt(a.replace(/[^0-9]/g, ''), 10);

        const noteB = b.replace(/[0-9]/g, '');
        const octaveB = parseInt(b.replace(/[^0-9]/g, ''), 10);

        if (octaveA !== octaveB) {
            return octaveA - octaveB;
        }

        return noteOrder.indexOf(noteA) - noteOrder.indexOf(noteB);
    };

    useEffect(() => {
        const [lowerNote, upperNote] = range;

        if (compareNotes(lowerNote, upperNote) > 0) {
            setRange([upperNote, lowerNote]);
        }
    }, [range]);

    const getFilteredNoteOptions = (isMin: boolean): string[] => {
        if (isMin) {
            return noteOptions.filter(note => compareNotes(note, range[1]) <= 0);
        } else {
            return noteOptions.filter(note => compareNotes(note, range[0]) >= 0);
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md" style={{ backgroundColor: 'white', color: 'black' }}>
            <h1 className="text-xl font-bold text-center mb-4" style={{ color: 'black' }}>Control Musical</h1>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'black' }}>Seleccionar Notas:</label>
                <div className="flex relative h-32 mb-4">
                    {pianoKeys.map((pianoKey, index) => (
                        <div key={index} className="relative" style={{ zIndex: pianoKey.isSharp ? 1 : 0 }}>
                            {!pianoKey.isSharp && (
                                <div
                                    onClick={() => handleKeyClick(pianoKey.note)}
                                    className="cursor-pointer border border-black"
                                    style={{
                                        width: '28px',
                                        height: '120px',
                                        backgroundColor: notes.includes(pianoKey.note) ? '#e0e0e0' : 'white',
                                        borderRadius: '0 0 4px 4px',
                                        display: 'inline-block',
                                    }}
                                ></div>
                            )}
                            {pianoKey.isSharp && (
                                <div
                                    onClick={() => handleKeyClick(pianoKey.note)}
                                    className="cursor-pointer absolute"
                                    style={{
                                        width: '18px',
                                        height: '70px',
                                        backgroundColor: notes.includes(pianoKey.note) ? '#666' : 'black',
                                        position: 'absolute',
                                        right: '-9px',
                                        top: 0,
                                        zIndex: 1,
                                        borderRadius: '0 0 4px 4px',
                                    }}
                                ></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: 'black' }}>Tecla Musical:</label>
                <select
                    value={musicalKey}
                    onChange={(e) => setMusicalKey(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    style={{ color: 'black' }}
                >
                    <option value="C">Do (C)</option>
                    <option value="C#">Do# (C#)</option>
                    <option value="D">Re (D)</option>
                    <option value="D#">Re# (D#)</option>
                    <option value="E">Mi (E)</option>
                    <option value="F">Fa (F)</option>
                    <option value="F#">Fa# (F#)</option>
                    <option value="G">Sol (G)</option>
                    <option value="G#">Sol# (G#)</option>
                    <option value="A">La (A)</option>
                    <option value="A#">La# (A#)</option>
                    <option value="B">Si (B)</option>
                </select>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: 'black' }}>BPM:</label>
                <input
                    type="text"
                    value={bpmInput}
                    onChange={handleBpmChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    style={{ color: 'black' }}
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: 'black' }}>Número de notas: {numberOfNotes}</label>
                <input
                    type="range"
                    min="1"
                    max="8"
                    value={numberOfNotes}
                    onChange={(e) => setNumberOfNotes(parseInt(e.target.value))}
                    className="mt-1 block w-full"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: 'black' }}>Rango de notas:</label>
                <div className="flex justify-between gap-4">
                    <select
                        value={range[0]}
                        onChange={(e) => setRange([e.target.value, range[1]])}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        style={{ color: 'black' }}
                    >
                        {getFilteredNoteOptions(true).map((note, index) => (
                            <option key={`min-${index}`} value={note}>{note}</option>
                        ))}
                    </select>
                    <span className="flex items-center" style={{ color: 'black' }}>a</span>
                    <select
                        value={range[1]}
                        onChange={(e) => setRange([range[0], e.target.value])}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        style={{ color: 'black' }}
                    >
                        {getFilteredNoteOptions(false).map((note, index) => (
                            <option key={`max-${index}`} value={note}>{note}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-between mb-4">
                <div>
                    <label className="inline-flex items-center" style={{ color: 'black' }}>
                        <input
                            type="checkbox"
                            checked={loop}
                            onChange={() => setLoop(!loop)}
                            className="form-checkbox h-5 w-5"
                            style={{ borderColor: 'black' }}
                        />
                        <span className="ml-2" style={{ color: 'black' }}>Loop</span>
                    </label>
                </div>

                <div>
                    <label className="inline-flex items-center" style={{ color: 'black' }}>
                        <input
                            type="checkbox"
                            checked={rhythm}
                            onChange={() => setRhythm(!rhythm)}
                            className="form-checkbox h-5 w-5"
                            style={{ borderColor: 'black' }}
                        />
                        <span className="ml-2" style={{ color: 'black' }}>Ritmo</span>
                    </label>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'black' }}>Notas seleccionadas:</label>
                <div className="flex flex-wrap gap-2">
                    {notes.length > 0 ?
                        notes.map((note, index) => (
                            <div key={index} className="px-3 py-1 rounded-full" style={{ backgroundColor: '#f0f0f0', color: 'black', border: '1px solid #ddd' }}>
                                {note}
                            </div>
                        )) :
                        <p style={{ color: '#666', fontStyle: 'italic' }}>No hay notas seleccionadas</p>
                    }
                </div>
                <button
                    onClick={() => setNotes([])}
                    className="mt-2 px-3 py-1 text-sm rounded hover:bg-gray-100"
                    style={{ border: '1px solid #ddd', color: 'black' }}
                >
                    Limpiar
                </button>
            </div>

            <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#f9f9f9' }}>
                <MelodyGenerator
                    keyId={regenerationKey.toString()}
                    musicalKey={musicalKey}
                    notes={notes}
                    range={range}
                    bpm={bpm}
                    loop={loop}
                    rhythm={rhythm}
                    numberOfNotes={numberOfNotes}
                    generatedSequence={generatedSequence}
                    setGeneratedSequence={setGeneratedSequence}
                    allNotes={allNotes}
                />
            </div>

            <button
                className="w-full py-2 px-4 font-semibold rounded-lg shadow-md"
                style={{ backgroundColor: 'white', color: 'black', border: '1px solid black' }}
                onClick={regenerateSequence}
            >
                Guardar Configuración
            </button>
        </div>
    );
};

export default Page;
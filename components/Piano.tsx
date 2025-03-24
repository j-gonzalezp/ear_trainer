import React, { useState, useEffect } from 'react';

import { createPiano } from '@/lib/melodyGenerators';

interface PianoKey {
  note: string;
  degree: string;
  soundNote: string;
}

interface PianoProps {
  activeDegrees?: string[];
  onKeyPress?: (degree: string) => void;
  disabled?: boolean;
  onToggleKey?: (selectedDegrees: string[]) => void;
}

interface BlackKeyProps {
  keyData: PianoKey;
  selectedKeys: Set<string>;
  disabled: boolean;
  handleKeyToggle: (degree: string) => void;
  handleKeyPress: (degree: string, soundNote: string) => void;
  onToggleKey: ((selectedDegrees: string[]) => void) | null;
  position: string;
}

// Define a more specific interface for your piano object
interface PianoObject {
  triggerAttackRelease: (note: string, duration: string) => void;
  dispose: () => void;
}

const Piano: React.FC<PianoProps> = ({ 
  activeDegrees = [],
  onKeyPress,
  disabled = false,
  onToggleKey = null
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [piano, setPiano] = useState<PianoObject | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set(activeDegrees));

  useEffect(() => {
    if (soundEnabled && !piano) {
      setPiano(createPiano());
    }
    return () => {
      if (piano) {
        piano.dispose();
      }
    };
  }, [soundEnabled, piano]);

  useEffect(() => {
    setSelectedKeys(new Set(activeDegrees));
  }, [activeDegrees]);

  const pianoKeys: PianoKey[] = [
    { note: 'C', degree: '1', soundNote: 'C4' },
    { note: 'C#', degree: '1#', soundNote: 'C#4' },
    { note: 'D', degree: '2', soundNote: 'D4' },
    { note: 'D#', degree: '2#', soundNote: 'D#4' },
    { note: 'E', degree: '3', soundNote: 'E4' },
    { note: 'F', degree: '4', soundNote: 'F4' },
    { note: 'F#', degree: '4#', soundNote: 'F#4' },
    { note: 'G', degree: '5', soundNote: 'G4' },
    { note: 'G#', degree: '5#', soundNote: 'G#4' },
    { note: 'A', degree: '6', soundNote: 'A4' },
    { note: 'A#', degree: '6#', soundNote: 'A#4' },
    { note: 'B', degree: '7', soundNote: 'B4' }
  ];

  const handleKeyPress = (degree: string, soundNote: string): void => {
    if (onKeyPress) {
      onKeyPress(degree);
    }
    
    if (soundEnabled && piano) {
      piano.triggerAttackRelease(soundNote, "8n");
    }
  };

  const handleKeyToggle = (degree: string): void => {
    if (disabled) return;
    
    const newSelectedKeys = new Set(selectedKeys);
    if (newSelectedKeys.has(degree)) {
      newSelectedKeys.delete(degree);
    } else {
      newSelectedKeys.add(degree);
    }
    
    setSelectedKeys(newSelectedKeys);
    
    if (onToggleKey) {
      onToggleKey(Array.from(newSelectedKeys));
    }
  };
  
  return (
    <div className="mt-4">
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="sound-toggle"
          checked={soundEnabled}
          onChange={() => setSoundEnabled(!soundEnabled)}
          className="mr-2 h-4 w-4"
        />
        <label htmlFor="sound-toggle" className="text-sm font-medium">
          Enable Sound
        </label>
      </div>
      
      <div className="w-full max-w-2xl mx-auto relative h-48">
        <div className="flex h-full">
          {pianoKeys
            .filter(key => !key.degree.includes('#'))
            .map((key) => {
              const isSelected = selectedKeys.has(key.degree);
              
              return (
                <div
                  key={`white-${key.degree}`}
                  className={`relative flex-1 transition-all duration-200 ${
                    disabled ? 'opacity-40' : 
                    isSelected ? 'bg-yellow-400 border-4 border-black' : 'bg-white border-4 border-gray-600'
                  }`}
                  style={{
                    borderRadius: '0 0 4px 4px',
                    marginLeft: '1px',
                    marginRight: '1px'
                  }}
                >
                  <button
                    className="absolute inset-0 w-full h-full flex items-end justify-center pb-2"
                    onClick={() => onToggleKey ? handleKeyToggle(key.degree) : handleKeyPress(key.degree, key.soundNote)}
                    disabled={disabled && !onToggleKey}
                  >
                    <span className={`text-sm font-medium ${
                      isSelected ? 'text-black' : 'text-gray-700'
                    }`}>
                      {key.degree}
                    </span>
                  </button>
                </div>
              );
            })}
        </div>
        
        <div className="absolute top-0 left-0 right-0 flex h-2/3">
          <div className="flex-1 relative">
            <BlackKey 
              keyData={pianoKeys.find(k => k.degree === '1#')!} 
              selectedKeys={selectedKeys}
              disabled={disabled}
              handleKeyToggle={handleKeyToggle}
              handleKeyPress={handleKeyPress}
              onToggleKey={onToggleKey}
              position="ml-8 -mr-6"
            />
          </div>
          
          <div className="flex-1 relative">
            <BlackKey 
              keyData={pianoKeys.find(k => k.degree === '2#')!} 
              selectedKeys={selectedKeys}
              disabled={disabled}
              handleKeyToggle={handleKeyToggle}
              handleKeyPress={handleKeyPress}
              onToggleKey={onToggleKey}
              position="ml-4 -mr-6"
            />
          </div>
          
          <div className="flex-1 relative"></div>
          
          <div className="flex-1 relative">
            <BlackKey 
              keyData={pianoKeys.find(k => k.degree === '4#')!} 
              selectedKeys={selectedKeys}
              disabled={disabled}
              handleKeyToggle={handleKeyToggle}
              handleKeyPress={handleKeyPress}
              onToggleKey={onToggleKey}
              position="ml-8 -mr-6"
            />
          </div>
          
          <div className="flex-1 relative">
            <BlackKey 
              keyData={pianoKeys.find(k => k.degree === '5#')!} 
              selectedKeys={selectedKeys}
              disabled={disabled}
              handleKeyToggle={handleKeyToggle}
              handleKeyPress={handleKeyPress}
              onToggleKey={onToggleKey}
              position="ml-4 -mr-6"
            />
          </div>
          
          <div className="flex-1 relative">
            <BlackKey 
              keyData={pianoKeys.find(k => k.degree === '6#')!} 
              selectedKeys={selectedKeys}
              disabled={disabled}
              handleKeyToggle={handleKeyToggle}
              handleKeyPress={handleKeyPress}
              onToggleKey={onToggleKey}
              position="ml-4 -mr-6"
            />
          </div>
          
          <div className="flex-1 relative"></div>
        </div>
      </div>
    </div>
  );
};

const BlackKey: React.FC<BlackKeyProps> = ({ 
  keyData, 
  selectedKeys, 
  disabled, 
  handleKeyToggle, 
  handleKeyPress, 
  onToggleKey,
  position
}) => {
  const isSelected = selectedKeys.has(keyData.degree);
  
  return (
    <div
      className={`absolute w-12 h-full ${position} transition-all duration-200 ${
        disabled ? 'opacity-40' : 
        isSelected ? 'bg-yellow-400 border-4 border-black z-10' : 'bg-gray-500 border-4 border-gray-600 z-10'
      }`}
      style={{
        borderRadius: '0 0 4px 4px'
      }}
    >
      <button
        className="absolute inset-0 w-full h-full flex items-end justify-center pb-2"
        onClick={() => onToggleKey ? handleKeyToggle(keyData.degree) : handleKeyPress(keyData.degree, keyData.soundNote)}
        disabled={disabled && !onToggleKey}
      >
        <span className={`text-sm font-medium ${
          isSelected ? 'text-black' : 'text-gray-300'
        }`}>
          {keyData.degree}
        </span>
      </button>   
    </div>
  );
};

export default Piano;
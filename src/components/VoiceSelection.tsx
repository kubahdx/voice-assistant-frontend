import React from 'react';

interface VoiceSelectionProps {
  onVoiceSelect: (voice: 'male' | 'female') => void;
  currentVoice: 'male' | 'female' | null;
}

const VoiceSelection: React.FC<VoiceSelectionProps> = ({ onVoiceSelect, currentVoice }) => {
  const handleSelect = (voice: 'male' | 'female') => {
    onVoiceSelect(voice);
  };

  return (
    <div>
      <h3>Wybierz głos agenta:</h3>
      <button
        onClick={() => handleSelect('male')}
        style={{ fontWeight: currentVoice === 'male' ? 'bold' : 'normal', marginRight: '10px' }}
      >
        Głos Męski
      </button>
      <button
        onClick={() => handleSelect('female')}
        style={{ fontWeight: currentVoice === 'female' ? 'bold' : 'normal' }}
      >
        Głos Żeński
      </button>
    </div>
  );
};

export default VoiceSelection; 
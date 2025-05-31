import React, { useState, useEffect } from 'react';
import VoiceSelection from './components/VoiceSelection';
import { Room } from 'livekit-client';
import { LiveKitRoom, StartAudio, AudioTrack, useVoiceAssistant, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

const LIVEKIT_SERVER_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';

const App: React.FC = () => {
  const [selectedVoice, setSelectedVoice] = useState<'male' | 'female' | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVoiceSelect = (voice: 'male' | 'female') => {
    if (token && room) {
      console.warn("Aby zmienić głos, najpierw się rozłącz.");
      return;
    }
    setSelectedVoice(voice);
    const newRoomName = voice === 'male' ? 'voice-assistant-room-male' : 'voice-assistant-room-female';
    setRoomName(newRoomName);
    setError(null);
    console.log(`Wybrano głos: ${voice}, pokój docelowy: ${newRoomName}`);
  };

  const getToken = async (identity: string, currentRoomName: string, voiceChoice: string | null): Promise<string | null> => {
    if (!currentRoomName) {
      setError("Nazwa pokoju nie jest ustawiona. Wybierz głos.");
      return null;
    }
    try {
      const queryParams = new URLSearchParams({
        roomName: currentRoomName,
        participantName: identity,
      });
      const response = await fetch(`/api/connection-details?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Nie udało się pobrać tokenu: ${response.status} ${errorData}`);
      }
      const data = await response.json();
      if (!data.token) {
        throw new Error("Token nie został zwrócony przez serwer.");
      }
      return data.token as string;
    } catch (e: unknown) {
      console.error("Błąd pobierania tokenu:", e);
      if (e instanceof Error) {
        setError(`Błąd pobierania tokenu: ${e.message}`);
      } else {
        setError("Wystąpił nieznany błąd podczas pobierania tokenu.");
      }
      return null;
    }
  };

  const connectToRoom = async () => {
    if (!selectedVoice || !roomName) {
      setError("Proszę najpierw wybrać głos agenta.");
      return;
    }
    if (token && room && room.state !== 'disconnected') {
        setError("Jesteś już połączony. Rozłącz się, aby połączyć ponownie lub zmienić głos.");
        return;
    }

    setIsConnecting(true);
    setError(null);

    const participantName = `user-${Math.random().toString(36).substring(7)}`;
    const newToken = await getToken(participantName, roomName, selectedVoice);

    if (newToken) {
      setToken(newToken);
      setRoom(new Room());
    }
  };

  useEffect(() => {
    const currentRoom = room;
    return () => {
      if (currentRoom && currentRoom.state !== 'disconnected') {
        currentRoom.disconnect();
      }
    };
  }, [room]);

  const resetState = () => {
    console.log("Resetowanie stanu aplikacji do ekranu wyboru głosu.");
    setToken(null);
    setRoom(null);
    setSelectedVoice(null);
    setRoomName(null);
    setError(null);
    setIsConnecting(false);
  };

  const VoiceAssistantUI = () => {
    const { state: agentState, audioTrack: agentAudioTrack } = useVoiceAssistant();
    
    if (!agentAudioTrack && agentState !== 'speaking' && agentState !== 'thinking') {
      return <p>Oczekiwanie na agenta ({selectedVoice === 'male' ? 'głos męski' : 'głos żeński'})...</p>;
    }
    return (
      <div style={{border: '1px solid #eee', padding: '15px', marginTop: '15px'}}>
        <p><strong>Agent ({selectedVoice === 'male' ? 'głos męski' : 'głos żeński'})</strong></p>
        <p>Stan: {agentState}</p>
        {agentAudioTrack && <AudioTrack trackRef={agentAudioTrack} />}
      </div>
    );
  };

  if (!token || !room) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{textAlign: 'center'}}>Wirtualny Asystent</h1>
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <VoiceSelection onVoiceSelect={handleVoiceSelect} currentVoice={selectedVoice} />
          {selectedVoice && (
            <>
              <p style={{ marginTop: '10px' }}>Wybrany głos: <strong>{selectedVoice === 'male' ? 'Męski' : 'Żeński'}</strong>.</p>
              <button 
                onClick={connectToRoom} 
                disabled={isConnecting || !selectedVoice}
                style={{ marginTop: '20px', padding: '10px 15px', fontSize: '16px', cursor: 'pointer' }}
              >
                {isConnecting ? 'Łączenie...' : 'Połącz z Agentem'}
              </button>
            </>
          )}
          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{textAlign: 'center'}}>Wirtualny Asystent</h1>
      <LiveKitRoom
        room={room} 
        token={token}
        serverUrl={LIVEKIT_SERVER_URL}
        connect={true}
        onConnected={() => {
          console.log('Połączono z pokojem LiveKit:', roomName);
          setIsConnecting(false);
          setError(null);
          room?.localParticipant?.setMicrophoneEnabled(true).catch(e => console.error("Błąd włączania mikrofonu", e));
        }}
        onDisconnected={() => {
          console.log('Rozłączono z pokojem LiveKit. Resetowanie stanu.');
          resetState();
        }}
        onError={(e: Error) => {
          console.error("Błąd LiveKitRoom:", e);
          setError(`Błąd połączenia LiveKit: ${e.message}`);
          resetState();
        }}
        style={{ marginTop: '20px' }}
      >
        <StartAudio label="Kliknij, aby zezwolić na dźwięk" />
        <VoiceAssistantUI />
        <RoomAudioRenderer />          
        <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
          Jesteś w pokoju: <strong>{roomName}</strong>
        </p>
        <button 
          onClick={() => room?.disconnect()}
          style={{ marginTop: '20px', padding: '8px 12px'}}
        >
          Rozłącz
        </button>
      </LiveKitRoom>
    </div>
  );
};

export default App; 
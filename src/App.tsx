import React, { useState, useEffect } from 'react';
import VoiceSelection from './components/VoiceSelection';
import { Room } from 'livekit-client';
import { LiveKitRoom, StartAudio, AudioTrack, useVoiceAssistant, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

const LIVEKIT_SERVER_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880'; // Użyj zmiennej środowiskowej lub domyślnej

const App: React.FC = () => {
  const [selectedVoice, setSelectedVoice] = useState<'male' | 'female' | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVoiceSelect = (voice: 'male' | 'female') => {
    if (room && room.state !== 'disconnected') { // Sprawdzamy czy pokój jest aktywny
      console.log("Zmiana głosu po połączeniu - wymaga rozłączenia i ponownego połączenia z nowym pokojem.");
      // Można dodać logikę automatycznego rozłączenia, jeśli jest to pożądane
      // room.disconnect();
      // setRoom(null);
      // setToken(null);
      // setRoomName(null); // Reset nazwy pokoju, aby wymusić ponowne ustawienie
      // setSelectedVoice(null); // Reset wyboru, aby użytkownik musiał kliknąć "Połącz"
      // return; // Zapobiegaj dalszemu przetwarzaniu, jeśli chcesz wymusić rozłączenie
    }
    setSelectedVoice(voice);
    const newRoomName = voice === 'male' ? 'voice-assistant-room-male' : 'voice-assistant-room-female';
    setRoomName(newRoomName);
    console.log(`Wybrano głos: ${voice}, pokój docelowy: ${newRoomName}`);
  };

  const getToken = async (identity: string, currentRoomName: string, voiceChoice: string | null): Promise<string | null> => {
    if (!currentRoomName) {
      setError("Nazwa pokoju nie jest ustawiona.");
      return null;
    }
    try {
      const queryParams = new URLSearchParams({
        roomName: currentRoomName,
        participantName: identity,
        voice: voiceChoice || '',
      });
      const response = await fetch(`/api/token?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Nie udało się pobrać tokenu: ${response.status} ${errorData}`);
      }
      const data = await response.json();
      if (!data.token) {
        throw new Error("Token nie został zwrócony przez serwer.");
      }
      return data.token as string;
    } catch (e: unknown) { // Użycie unknown zamiast any
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
    if (room && room.state !== 'disconnected') {
      setError("Jesteś już połączony lub trwa łączenie.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    const participantName = `user-${Math.random().toString(36).substring(7)}`;
    const newToken = await getToken(participantName, roomName, selectedVoice);

    if (newToken) {
      setToken(newToken);
      // Tworzymy nową instancję Room tylko jeśli jeszcze nie istnieje lub poprzednia jest całkowicie "zużyta"
      // LiveKitRoom będzie zarządzał połączeniem dla przekazanej instancji
      if (!room || room.state === 'disconnected') {
        const newRoomInstance = new Room();
        setRoom(newRoomInstance);
      }
    } else {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    // Ten useEffect będzie rozłączał pokój przy odmontowywaniu komponentu App
    // lub gdy instancja `room` się zmieni (co nie powinno się dziać często po pierwszym ustawieniu).
    const currentRoom = room;
    return () => {
      currentRoom?.disconnect();
    };
  }, [room]);

  const VoiceAssistantUI = () => {
    const { state: agentState, audioTrack: agentAudioTrack, agentTranscriptions, agentAttributes } = useVoiceAssistant();
    
    useEffect(() => {
        console.log("Agent state changed:", agentState);
        console.log("Agent attributes:", agentAttributes);
        if(agentTranscriptions && agentTranscriptions.length > 0) {
            console.log("Agent transcriptions:", agentTranscriptions);
        }
    }, [agentState, agentAudioTrack, agentTranscriptions, agentAttributes]);

    if (!agentAudioTrack && agentState !== 'speaking' && agentState !== 'thinking') {
      return <p>Oczekiwanie na agenta ({selectedVoice === 'male' ? 'głos męski' : 'głos żeński'})...</p>;
    }
    return (
      <div style={{border: '1px solid #eee', padding: '15px', marginTop: '15px'}}>
        <p><strong>Agent ({selectedVoice === 'male' ? 'głos męski' : 'głos żeński'})</strong></p>
        <p>Stan: {agentState}</p>
        {agentAudioTrack && <AudioTrack trackRef={agentAudioTrack} />}
        {/* Można tu dodać wizualizację np. <BarVisualizer /> jeśli jest potrzeba */}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{textAlign: 'center'}}>Wirtualny Asystent</h1>
      
      {(!room || room.state === 'disconnected') && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px'}}>
          <VoiceSelection onVoiceSelect={handleVoiceSelect} currentVoice={selectedVoice} />
          {selectedVoice && roomName && (
            <p style={{ marginTop: '10px' }}>Wybrany głos: <strong>{selectedVoice === 'male' ? 'Męski' : 'Żeński'}</strong>.</p>
          )}
          <button 
            onClick={connectToRoom} 
            disabled={!selectedVoice || !roomName || isConnecting}
            style={{ marginTop: '20px', padding: '10px 15px', fontSize: '16px', cursor: 'pointer' }}
          >
            {isConnecting ? 'Łączenie...' : 'Połącz z Agentem'}
          </button>
          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
      )}

      {room && token && LIVEKIT_SERVER_URL && roomName && room.state !== 'disconnected' && (
        <LiveKitRoom
          room={room} 
          token={token}
          serverUrl={LIVEKIT_SERVER_URL}
          connect={true}
          onConnected={() => {
            console.log('Połączono z pokojem LiveKit:', roomName);
            setIsConnecting(false);
            setError(null);
            room.localParticipant.setMicrophoneEnabled(true).catch(e => console.error("Błąd włączania mikrofonu", e));
          }}
          onDisconnected={() => {
            console.log('Rozłączono z pokojem LiveKit');
            setIsConnecting(false);
            // Nie resetujemy tokenu i pokoju tutaj, aby umożliwić LiveKitRoom zarządzanie stanem.
            // Aby wymusić pełne ponowne połączenie (np. po zmianie pokoju), należy wyrenderować LiveKitRoom od nowa
            // lub zarządzać nową instancją `Room` i nowym `tokenem`.
            // W tym przypadku, po rozłączeniu, UI wyboru głosu i przycisk "Połącz" powinny się znów pojawić.
          }}
          onError={(e: Error) => {
            console.error("Błąd LiveKitRoom:", e);
            setError(`Błąd połączenia LiveKit: ${e.message}`);
            setIsConnecting(false);
            // Po błędzie, możemy chcieć zresetować stan, aby użytkownik mógł spróbować ponownie
            // setRoom(null); // To spowoduje ponowne pokazanie opcji wyboru głosu
            // setToken(null);
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
            onClick={() => room.disconnect()} 
            style={{ marginTop: '20px', padding: '8px 12px'}}
          >
            Rozłącz
          </button>
        </LiveKitRoom>
      )}
    </div>
  );
};

export default App; 
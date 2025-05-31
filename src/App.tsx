import React, { useState } from 'react';
import VoiceSelection from './components/VoiceSelection'; // Założenie ścieżki

// Tutaj docelowo będzie logika połączenia z LiveKit
// const LIVEKIT_SERVER_URL = 'ws://localhost:7880'; // Przykładowy URL

const App: React.FC = () => {
  const [selectedVoice, setSelectedVoice] = useState<'male' | 'female' | null>(null);
  // const [room, setRoom] = useState<Room | null>(null);
  // const [token, setToken] = useState<string | null>(null);

  const handleVoiceSelect = (voice: 'male' | 'female') => {
    setSelectedVoice(voice);
    console.log(`Wybrano głos: ${voice}`);
    // Tutaj w przyszłości można dodać logikę np. rozłączenia i ponownego połączenia z nowym agentem
    // lub przekazania tej informacji do już połączonego agenta, jeśli API na to pozwala.
  };

  // Funkcja do pobierania tokenu - uproszczona
  // W rzeczywistej aplikacji token powinien być generowany po stronie serwera
  // i przekazywany do frontendu w bezpieczny sposób.
  // const getToken = async (roomName: string, participantName: string, voice?: string) => {
  //   // Zapytanie do Twojego backendu, który wygeneruje token
  //   // W tym zapytaniu możesz przekazać `voice`
  //   // const response = await fetch(`/api/token?roomName=${roomName}&participantName=${participantName}&voice=${voice || ''}`);
  //   // const data = await response.json();
  //   // return data.token;
  //   // Symulacja:
  //   return `debug-token-for-${roomName}-${participantName}${voice ? '-voice-' + voice : ''}`;
  // };

  // const connectToRoom = async () => {
  //   if (!selectedVoice) {
  //     alert("Proszę najpierw wybrać głos agenta.");
  //     return;
  //   }
  //   const roomName = 'my-voice-assistant-room';
  //   const participantName = `user-${Math.random().toString(36).substring(7)}`;

  //   // Tutaj przekazujemy informację o wybranym głosie do funkcji generującej token
  //   // lub do logiki inicjalizacji agenta. Zależnie od tego jak backend będzie to obsługiwał.
  //   // const newToken = await getToken(roomName, participantName, selectedVoice);
  //   // setToken(newToken);

  //   // const newRoom = new Room();
  //   // setRoom(newRoom);

  //   // newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
  //   //   console.log('Participant connected:', participant.identity);
  //   //   if (participant.kind === Participant.Kind.AGENT) {
  //   //     console.log('Agent connected!');
  //   //     // Tutaj można dodatkowo sprawdzić, czy agent ma odpowiedni "profil" głosu,
  //   //     // jeśli backend rozdziela agentów na różne instancje per głos.
  //   //   }
  //   // });

  //   // try {
  //   //   await newRoom.connect(LIVEKIT_SERVER_URL, newToken);
  //   //   console.log('Connected to room:', roomName);
  //   //   // Publikacja lokalnych tracków audio użytkownika, etc.
  //   //   // await newRoom.localParticipant.setMicrophoneEnabled(true);
  //   // } catch (error) {
  //   //   console.error('Failed to connect to room:', error);
  //   // }
  // };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Wirtualny Asystent</h1>
      <VoiceSelection onVoiceSelect={handleVoiceSelect} currentVoice={selectedVoice} />
      {selectedVoice && <p>Wybrany głos: {selectedVoice === 'male' ? 'Męski' : 'Żeński'}</p>}

      {/* <button onClick={connectToRoom} disabled={!selectedVoice || !!room}>
        {room ? 'Połączono' : 'Połącz z Agentem'}
      </button> */}

      {/* Tutaj można dodać komponenty LiveKit, np. AudioConference,
          po nawiązaniu połączenia i uzyskaniu tokenu.
          Przykład:
          {room && token && (
            <LiveKitRoom
              token={token}
              serverUrl={LIVEKIT_SERVER_URL}
              connect={true}
              // Można by przekazać tu `key={selectedVoice}` aby wymusić re-render LiveKitRoom
              // jeśli zmiana głosu wymaga nowego połączenia/tokenu z backendu.
              // Ale to zależy od implementacji.
            >
              <StartAudio label="Kliknij, aby włączyć dźwięk" />
              <p>Rozmowa z agentem ({selectedVoice === 'male' ? 'głos męski' : 'głos żeński'}):</p>
              {/*
                Komponenty do wyświetlania audio agenta i wysyłania audio użytkownika.
                Np. useVoiceAssistant, ParticipantAudioTile etc.
                const { state, audioTrack } = useVoiceAssistant();
                if (audioTrack) return <AudioTrack trackRef={audioTrack} />;
              *}
            </LiveKitRoom>
          )}
      */}
      <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
        (Dalsza integracja z LiveKit i backendem w kolejnych krokach)
      </p>
    </div>
  );
};

export default App; 
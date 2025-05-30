"use client";

import { CloseIcon } from "@/components/CloseIcon";
import { NoAgentNotification } from "@/components/NoAgentNotification";
import TranscriptionView from "@/components/TranscriptionView";
import {
  BarVisualizer,
  DisconnectButton,
  RoomAudioRenderer,
  RoomContext,
  VideoTrack,
  VoiceAssistantControlBar,
  useVoiceAssistant,
  // Dodajemy LiveKitRoom, jeśli jeszcze go nie było, lub upewniamy się, że jest
  LiveKitRoom, 
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import type { ConnectionDetails } from "./api/connection-details/route";
import CallHeader from "@/components/CallHeader";
import WelcomePopup from "@/components/WelcomePopup";

type AgentPersonality = "female" | "male";

export default function Page() {
  // Usuwamy inicjalizację `new Room()` stąd, bo LiveKitRoom sam sobie stworzy instancję
  // lub możemy ją przekazać, ale dla prostoty tego przykładu pozwólmy LiveKitRoom zarządzać.
  // Jeśli jednak używasz `room.on(...)` poza kontekstem <LiveKitRoom>, musisz ją zachować
  // i przekazać do <LiveKitRoom> przez <RoomContext.Provider> LUB jako prop.
  // W tym przykładzie `room` jest używany w `useEffect`, więc go zostawiamy i owijamy <LiveKitRoom> w <RoomContext.Provider>
  const [room] = useState(() => new Room()); 
  const [showWelcomePopup, setShowWelcomePopup] = useState(true); // Pokaż popup na starcie

  const [token, setToken] = useState<string | null>(null);
  const [liveKitUrl, setLiveKitUrl] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Usunięty useEffect, który tylko ustawiał showWelcomePopup, bo teraz kontrolujemy go inaczej

  const handleClosePopup = () => {
    setShowWelcomePopup(false);
  };

  const onConnectButtonClicked = useCallback(async (personality: AgentPersonality) => {
    if (isConnecting || room.state !== "disconnected") return;

    console.log(`Rozpoczynanie rozmowy z osobowością: ${personality}`);
    setShowWelcomePopup(false); // Ukryj popup, gdy zaczynamy łączyć
    setIsConnecting(true);
    try {
      const url = new URL(
        process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
        window.location.origin,
      );
      url.searchParams.append("personality", personality);

      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorText = await response.text();
        // Po nieudanym fetchu, pozwól użytkownikowi spróbować ponownie
        setIsConnecting(false); 
        setShowWelcomePopup(true); // Pokaż znowu popup lub przyciski wyboru
        throw new Error(
          `Nie udało się pobrać danych połączeniowych: ${response.status} ${errorText}`,
        );
      }
      const connectionDetailsData: ConnectionDetails = await response.json();

      console.log("Odebrano dane połączeniowe:", connectionDetailsData);
      
      setLiveKitUrl(connectionDetailsData.serverUrl);
      setToken(connectionDetailsData.participantToken);
      // Stan isConnecting zostanie ustawiony na false w handlerze onConnected lub onDisconnected komponentu LiveKitRoom

    } catch (error) {
      console.error("Błąd podczas rozpoczynania konwersacji:", error);
      alert(`Błąd: ${error instanceof Error ? error.message : String(error)}`);
      setIsConnecting(false);
      setShowWelcomePopup(true); // Pokaż znowu popup lub przyciski wyboru
      setToken(null); 
    }
  }, [room, isConnecting]); // Dodano isConnecting do zależności

  useEffect(() => {
    const handleDeviceFailure = (error: Error) => {
        onDeviceFailure(error);
        setIsConnecting(false);
        setToken(null);
        setShowWelcomePopup(true);
    };

    // Te eventy są teraz bardziej dla informacji lub resetowania stanu,
    // bo LiveKitRoom zarządza głównym cyklem życia połączenia.
    const handleDisconnected = () => {
      console.log("Odłączono z pokoju (event z obiektu Room)");
      setToken(null); 
      setIsConnecting(false);
      setShowWelcomePopup(true); // Pokaż ekran wyboru po rozłączeniu
    };

    const handleConnected = () => {
        console.log("Połączono z pokojem (event z obiektu Room)!");
        setIsConnecting(false); 
        setShowWelcomePopup(false);
        // setMicrophoneEnabled jest teraz w callbacku onConnected LiveKitRoom
    };

    room.on(RoomEvent.MediaDevicesError, handleDeviceFailure);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.Connected, handleConnected);

    return () => {
      room.off(RoomEvent.MediaDevicesError, handleDeviceFailure);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      room.off(RoomEvent.Connected, handleConnected);
    };
  }, [room]);

  // --- Logika wyświetlania ---
  if (!token) { // Jeśli nie mamy tokenu, pokazujemy ekran wyboru lub ładowania
    return (
      <main data-lk-theme="default" className="h-full grid place-items-center content-center bg-[#F6F6F6] p-4">
        {/* Pokazuj WelcomePopup tylko jeśli nie łączymy się i nie ma błędu z tokenem */}
        {showWelcomePopup && !isConnecting && <WelcomePopup onClose={handleClosePopup} />}
        
        <div className="flex flex-col items-center justify-center">
          {isConnecting ? (
            // --- Animacja ładowania ---
            <div className="flex flex-col items-center justify-center text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{
                  width: '60px',
                  height: '60px',
                  border: '6px solid rgba(0, 0, 0, 0.1)', // Jaśniejszy kolor dla tła kółka
                  borderTop: '6px solid #AEC5D3', // Kolor pasujący do jednego z przycisków
                  borderRadius: '50%',
                }}
              />
              <p className="mt-5 text-lg text-gray-700">Łączenie z asystentem...</p>
            </div>
          ) : (
            // --- Przyciski wyboru osobowości (jeśli WelcomePopup jest zamknięty) ---
            !showWelcomePopup && (
              <>
                <h1 className="text-2xl font-semibold mb-8 text-center text-gray-800">Wybierz, z kim chcesz porozmawiać:</h1>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => onConnectButtonClicked('female')}
                    className="uppercase px-6 py-3 bg-[#D3AEC5] hover:bg-[#C39DB5] text-white rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D3AEC5] focus:ring-opacity-50"
                  >
                    Psycholożka (głos żeński)
                  </button>
                  <button
                    onClick={() => onConnectButtonClicked('male')}
                    className="uppercase px-6 py-3 bg-[#AEC5D3] hover:bg-[#9DB5C3] text-white rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#AEC5D3] focus:ring-opacity-50"
                  >
                    Psycholog (głos męski)
                  </button>
                </div>
              </>
            )
          )}
        </div>
      </main>
    );
  }

  // Jeśli mamy token i URL, renderujemy LiveKitRoom
  return (
    <main data-lk-theme="default" className="h-full grid content-center bg-[#F6F6F6]">
      {/* RoomContext.Provider jest potrzebny, jeśli komponenty wewnątrz LiveKitRoom
          lub sam LiveKitRoom potrzebują dostępu do tej konkretnej instancji `room`,
          którą stworzyliśmy wyżej. Komponenty LiveKit Components React często tworzą
          własny kontekst lub pobierają go. Dla pewności zostawiam. */}
      <RoomContext.Provider value={room}>
        <div className="lk-room-container max-w-[1024px] w-[90vw] mx-auto max-h-[90vh] bg-white shadow-xl rounded-lg">
          {liveKitUrl && token && ( // Upewnij się, że oba są dostępne przed renderowaniem
            <LiveKitRoom
              room={room} // Przekazujemy naszą instancję pokoju
              token={token}
              serverUrl={liveKitUrl}
              connect={true} 
              audio={true} 
              video={false} 
              onConnected={async () => {
                console.log("LiveKitRoom: Połączono!");
                setIsConnecting(false); // Połączenie udane, zatrzymaj animację ładowania
                setShowWelcomePopup(false);
                if (room.localParticipant) {
                  try {
                    await room.localParticipant.setMicrophoneEnabled(true);
                    console.log("LiveKitRoom: Mikrofon włączony.");
                  } catch (micError) {
                    console.error("LiveKitRoom: Błąd włączania mikrofonu:", micError);
                    onDeviceFailure(micError instanceof Error ? micError : new Error(String(micError)));
                  }
                }
              }}
              onDisconnected={() => {
                console.log("LiveKitRoom: Rozłączono.");
                setToken(null); 
                setIsConnecting(false);
                setShowWelcomePopup(true);
              }}
              // Dodajemy onError, aby złapać ewentualne błędy połączenia z LiveKitRoom
              onError={(error) => {
                console.error("LiveKitRoom: Błąd połączenia:", error);
                alert(`Błąd połączenia z LiveKit: ${error.message}`);
                setToken(null);
                setIsConnecting(false);
                setShowWelcomePopup(true);
              }}
            >
              <SimpleVoiceAssistantInsideRoom />
            </LiveKitRoom>
          )}
        </div>
      </RoomContext.Provider>
    </main>
  );
}

function SimpleVoiceAssistantInsideRoom() {
  const { state: agentState } = useVoiceAssistant();
  // const room = useContext(RoomContext); // Jeśli potrzebujesz dostępu do obiektu pokoju tutaj

  return (
    <>
      <AnimatePresence mode="wait">
        {agentState === "disconnected" && (
          <motion.div 
            key="disconnected-state-in-room" // Unikalny klucz
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full p-4 text-center"
          >
             <p className="text-lg text-gray-700 mb-4">Połączenie z asystentem zostało zakończone lub wystąpił błąd.</p>
             {/* Możesz dodać przycisk, który np. wywołuje `window.location.reload()` 
                 lub bardziej zaawansowaną logikę ponownego połączenia */}
          </motion.div>
        )}
        {/* Sprawdzamy, czy agentState nie jest null/undefined, aby uniknąć błędów renderowania */}
        {agentState && agentState !== "disconnected" && (
          <motion.div
            key="connected-state-in-room" // Unikalny klucz
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex flex-col items-center gap-4 h-full bg-[#f7f7f6]"
          >
            <CallHeader />
            <AgentVisualizer />
            <div className="flex-1 w-full">
              <TranscriptionView />
            </div>
            <div className="w-full">
              <ControlBar /> 
            </div>
            <RoomAudioRenderer />
            <NoAgentNotification state={agentState} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AgentVisualizer() {
  const { state: agentState, videoTrack, audioTrack } = useVoiceAssistant();

  if (videoTrack) {
    return (
      <div className="h-[512px] w-[514px] rounded-lg overflow-hidden">
        <VideoTrack trackRef={videoTrack} />
      </div>
    );
  }
  return (
    <div className="h-[300px] w-full">
      <BarVisualizer
        state={agentState}
        barCount={7}
        trackRef={audioTrack}
        className="agent-visualizer" // Upewnij się, że masz style dla tej klasy
        options={{ minHeight: 24 }}
      />
    </div>
  );
}

function ControlBar() {
  const { state: agentState } = useVoiceAssistant();
  // const room = useContext(RoomContext); // Możesz potrzebować, jeśli DisconnectButton nie działa z hooka

  return (
    <div className="relative h-[60px]">
      <AnimatePresence>
        {/* Usuwamy warunek agentState === "disconnected" dla VoiceAssistantControlBar,
            bo przycisk rozłączania jest teraz głównym elementem kontrolnym po połączeniu. */}
        {agentState && agentState !== "disconnected" && agentState !== "connecting" && (
          <motion.div
            initial={{ opacity: 0, top: "10px" }}
            animate={{ opacity: 1, top: 0 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex h-8 absolute left-1/2 -translate-x-1/2  justify-center items-center" // Dodano items-center
          >
            {/* Upewnij się, że VoiceAssistantControlBar nie ma własnego przycisku rozłączania,
                jeśli używasz dedykowanego DisconnectButton obok */}
            <VoiceAssistantControlBar controls={{ leave: false }} />
            <DisconnectButton /* onClick={() => room?.disconnect()} */ > {/* Jeśli DisconnectButton potrzebuje room z kontekstu */}
              <CloseIcon />
            </DisconnectButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function onDeviceFailure(error: Error) {
  console.error("Błąd urządzenia:", error);
  alert(
    "Błąd podczas uzyskiwania uprawnień do kamery lub mikrofonu. Upewnij się, że nadałeś niezbędne uprawnienia w przeglądarce i przeładuj kartę.",
  );
}

// Typ ConnectionDetails, upewnij się, że jest zdefiniowany lub zaimportowany poprawnie
// export type ConnectionDetails = {
//   serverUrl: string;
//   roomName: string;
//   participantName: string;
//   participantToken: string;
// };
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
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import type { ConnectionDetails } from "./api/connection-details/route";
import CallHeader from "@/components/CallHeader";
import WelcomePopup from "@/components/WelcomePopup";
import { VoiceSelectionUI } from "@/components/VoiceSelectionUI";

export default function Page() {
  const [room] = useState(new Room());
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<"male" | "female" | null>(
    null
  );
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setShowWelcomePopup(true);
  }, []);

  const handleClosePopup = () => {
    setShowWelcomePopup(false);
  };

  const onConnectButtonClicked = useCallback(
    async (voice: "male" | "female") => {
      if (isConnecting) return;
      setIsConnecting(true);
      setSelectedVoice(voice);

      const baseUrl =
        process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details";
      const url = new URL(baseUrl, window.location.origin);
      url.searchParams.append("voice", voice);

      try {
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Failed to fetch connection details: ${response.statusText}`);
        }
        const connectionDetailsData: ConnectionDetails = await response.json();

        await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch (error) {
        console.error("Error connecting to room:", error);
        alert("Wystąpił błąd podczas próby połączenia. Sprawdź konsolę, aby uzyskać więcej informacji.");
        setSelectedVoice(null);
      } finally {
        setIsConnecting(false);
      }
    },
    [room, isConnecting]
  );

  useEffect(() => {
    room.on(RoomEvent.MediaDevicesError, onDeviceFailure);

    return () => {
      room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
    };
  }, [room]);

  return (
    <main data-lk-theme="default" className="h-full grid content-center bg-[#F6F6F6]">
      {showWelcomePopup && <WelcomePopup onClose={handleClosePopup} />}
      <RoomContext.Provider value={room}>
        <div className="lk-room-container max-w-[1024px] w-[90vw] mx-auto max-h-[90vh]">
          <SimpleVoiceAssistant
            onConnectButtonClicked={onConnectButtonClicked}
            selectedVoice={selectedVoice}
            isConnecting={isConnecting}
          />
        </div>
      </RoomContext.Provider>
    </main>
  );
}

function SimpleVoiceAssistant(props: {
  onConnectButtonClicked: (voice: "male" | "female") => void;
  selectedVoice: "male" | "female" | null;
  isConnecting: boolean;
}) {
  const { state: agentState } = useVoiceAssistant();

  const handleVoiceSelectAndConnect = (voice: "male" | "female") => {
    if (!props.isConnecting) {
      props.onConnectButtonClicked(voice);
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {agentState === "disconnected" && !props.selectedVoice ? (
          <VoiceSelectionUI onVoiceSelect={handleVoiceSelectAndConnect} />
        ) : agentState === "disconnected" && props.selectedVoice && props.isConnecting ? (
          <motion.div
            key="connecting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="grid items-center justify-center h-full bg-[#F6F6F6]"
          >
            <p className="text-lg text-gray-600">Łączenie...</p>
          </motion.div>
        ) : agentState === "disconnected" && props.selectedVoice && !props.isConnecting ? (
          <motion.div
            key="disconnected-retry"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="grid items-center justify-center h-full bg-[#F6F6F6] gap-4"
          >
            <p className="text-lg text-center text-gray-700">
              Nie udało się połączyć. <br />Spróbuj ponownie wybrać głos.
            </p>
            <VoiceSelectionUI onVoiceSelect={handleVoiceSelectAndConnect} />
          </motion.div>
        ) : (
          <motion.div
            key="connected"
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
        className="agent-visualizer"
        options={{ minHeight: 24 }}
      />
    </div>
  );
}

function ControlBar() {
  const { state: agentState } = useVoiceAssistant();

  return (
    <div className="relative h-[60px]">
      <AnimatePresence>
        {agentState === "disconnected" && (
          <motion.button
            initial={{ opacity: 0, top: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="uppercase absolute left-1/2 -translate-x-1/2 px-4 py-2 bg-[#C3CB9C] text-white rounded-md"
          >
            ZACZNIJ ROZMOWE PONOWNIE (debug)
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {agentState !== "disconnected" && agentState !== "connecting" && (
          <motion.div
            initial={{ opacity: 0, top: "10px" }}
            animate={{ opacity: 1, top: 0 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex h-8 absolute left-1/2 -translate-x-1/2  justify-center"
          >
            <VoiceAssistantControlBar controls={{ leave: false }} />
            <DisconnectButton>
              <CloseIcon />
            </DisconnectButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function onDeviceFailure(error: Error) {
  console.error(error);
  alert(
    "Błąd podczas uzyskiwania uprawnień do kamery lub mikrofonu. Upewnij się, że nadałeś niezbędne uprawnienia w przeglądarce i przeładuj kartę."
  );
}

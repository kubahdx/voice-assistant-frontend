// ASYSTENT_GLOSOWY/voice-assistant-frontend/app/api/connection-details/route.ts

import {
  AccessToken,
  AccessTokenOptions,
  VideoGrant,
  AgentDispatchClient, // <--- Używamy tego klienta
  // typ CreateDispatchOptions jest opcjonalny, ale przydatny do zrozumienia struktury
  // import type { CreateDispatchOptions } from "livekit-server-sdk"; 
} from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL; // Np. wss://twoj-projekt.livekit.cloud

export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export async function GET(request: NextRequest) {
  try {
    if (LIVEKIT_URL === undefined) {
      console.error("Błąd serwera: LIVEKIT_URL nie jest zdefiniowany");
      throw new Error("LIVEKIT_URL is not defined");
    }
    if (API_KEY === undefined) {
      console.error("Błąd serwera: LIVEKIT_API_KEY nie jest zdefiniowany");
      throw new Error("LIVEKIT_API_KEY is not defined");
    }
    if (API_SECRET === undefined) {
      console.error("Błąd serwera: LIVEKIT_API_SECRET nie jest zdefiniowany");
      throw new Error("LIVEKIT_API_SECRET is not defined");
    }

    const { searchParams } = new URL(request.url);
    const personality = searchParams.get("personality") || "female";
    console.log(`Odebrano żądanie dla osobowości: ${personality}`);

    const participantIdentity = `voice_assistant_user_${Math.floor(
      Math.random() * 10_000,
    )}`;
    const roomName = `voice_assistant_room_${Math.floor(
      Math.random() * 10_000,
    )}`;
    
    const participantToken = await createParticipantToken(
      { identity: participantIdentity },
      roomName,
    );
    console.log(`Wygenerowano token dla użytkownika: ${participantIdentity} do pokoju: ${roomName}`);

    // --- Jawne Przydzielenie Agenta (Explicit Agent Dispatch) ---
    const livekitHost = LIVEKIT_URL.replace(/^wss?:\/\//, ''); 
    
    const agentDispatchClient = new AgentDispatchClient( // Poprawny klient
      livekitHost,
      API_KEY,
      API_SECRET,
    );

    const agentToDispatch = "psycholog-agent"; // Nazwa agenta, którego chcesz uruchomić
                                            // Powinna pasować do `agent_name` w WorkerOptions agenta Pythona,
                                            // jeśli tam ją ustawiłeś.
    const agentMetadata = JSON.stringify({
      personality: personality,
    });

    console.log(`Wysyłanie żądania dispatch dla agenta: ${agentToDispatch} do pokoju: ${roomName} z metadanymi: ${agentMetadata}`);
    try {
      // Poprawne wywołanie createDispatch zgodnie z dokumentacją
      await agentDispatchClient.createDispatch(
        roomName, 
        agentToDispatch, 
        { metadata: agentMetadata } // Opcje, w tym metadata
      );
      console.log(`Żądanie dispatch dla agenta wysłane pomyślnie dla pokoju: ${roomName}`);
    } catch (dispatchError) {
      console.error(`Błąd podczas wysyłania żądania dispatch dla agenta: ${dispatchError instanceof Error ? dispatchError.message : String(dispatchError)}`, dispatchError);
    }
    // --------------------------------------------------------------------

    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName: participantIdentity,
    };
    const headers = new Headers({
      "Cache-Control": "no-store",
    });
    return NextResponse.json(data, { headers });

  } catch (error) {
    if (error instanceof Error) {
      console.error("Błąd w /api/connection-details:", error.message, error.stack);
      return new NextResponse(error.message, { status: 500 });
    }
    console.error("Nieznany błąd w /api/connection-details:", error);
    return new NextResponse("An unknown error occurred", { status: 500 });
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "15m",
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  return at.toJwt();
}
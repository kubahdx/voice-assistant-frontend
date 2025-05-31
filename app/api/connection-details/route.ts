import { AccessToken, VideoGrant, RoomConfiguration, RoomAgentDispatch } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

// NOTE: you are expected to define the following environment variables in `.env.local` (lub w zmiennych środowiskowych hostingu):
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// don't cache the results
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
      throw new Error("LIVEKIT_URL is not defined");
    }
    if (API_KEY === undefined) {
      throw new Error("LIVEKIT_API_KEY is not defined");
    }
    if (API_SECRET === undefined) {
      throw new Error("LIVEKIT_API_SECRET is not defined");
    }

    const searchParams = request.nextUrl.searchParams;
    let roomName = searchParams.get("roomName");
    let participantIdentity = searchParams.get("participantName");
    const voice = searchParams.get("voice") as "male" | "female" | null;

    if (!roomName) {
      roomName = `voice-assistant-room_${Math.floor(Math.random() * 10_000)}`;
      console.warn(`roomName not provided, generated random: ${roomName}`);
    }

    if (!participantIdentity) {
      participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
      console.warn(`participantName not provided, generated random: ${participantIdentity}`);
    }

    let agentToDispatchName: string | null = null;
    if (voice === "female") {
      agentToDispatchName = "agent_female_nazwa"; // Dopasuj do nazwy w Pythonie
    } else if (voice === "male") {
      agentToDispatchName = "agent_male_nazwa";   // Dopasuj do nazwy w Pythonie
    }

    const token = new AccessToken(API_KEY, API_SECRET, {
      identity: participantIdentity,
      // Metadane uczestnika mogą nadal być przydatne dla samego agenta lub dla logowania
      metadata: voice ? JSON.stringify({ voice_gender: voice }) : undefined,
      ttl: "15m", // Czas życia tokenu
    });

    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    };
    token.addGrant(grant);

    // Dodaj konfigurację pokoju, aby jawnie przydzielić agenta, jeśli został wybrany
    if (agentToDispatchName) {
      const roomConfig = new RoomConfiguration({
        agents: [
          new RoomAgentDispatch({
            agentName: agentToDispatchName,
            // Opcjonalnie: możesz tu przekazać dodatkowe metadane specyficzne dla tego zadania (job) agenta
            // metadata: JSON.stringify({ custom_job_data: "example" })
          }),
        ],
      });
      token.withRoomConfig(roomConfig);
    } else {
      // Co jeśli żaden głos nie został wybrany lub parametr 'voice' jest niepoprawny?
      // Możesz zalogować ostrzeżenie lub nawet zwrócić błąd,
      // albo pozwolić na połączenie bez agenta (jeśli to ma sens w Twojej aplikacji).
      // Obecnie, jeśli agentToDispatchName jest null, żaden agent nie zostanie jawnie przydzielony przez RoomConfiguration.
      // Jeśli nie masz domyślnych Dispatch Rules w LiveKit Cloud, które by coś łapały,
      // to prawdopodobnie żaden agent nie dołączy.
      console.warn(`No specific agent dispatched for voice: ${voice}. Participant will join without explicit agent assignment via token.`);
    }

    const participantToken = await token.toJwt();

    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName: participantIdentity,
    };

    const headers = new Headers({
      "Cache-Control": "no-store", // Zapobiega cachowaniu odpowiedzi
    });

    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error in /api/connection-details:", error.message);
      return new NextResponse(error.message, { status: 500 });
    }
    console.error("Unknown error in /api/connection-details:", error);
    return new NextResponse("An unknown error occurred", { status: 500 });
  }
}
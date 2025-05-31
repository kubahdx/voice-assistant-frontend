import { AccessToken, VideoGrant } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

// Placeholder types based on expected structure for @livekit/protocol
// This is to satisfy TypeScript when actual types are not directly importable
// from livekit-server-sdk for construction, though AccessToken.d.ts references them.
interface LiveKitProtocolRoomAgentDispatch {
  agentName?: string;
  // other fields like version, id, metadata - assuming optional or handled by server if not provided
}

interface LiveKitProtocolRoomConfiguration {
  agents?: LiveKitProtocolRoomAgentDispatch[];
  // other RoomConfiguration fields
}

// NOTE: you are expected to define the following environment variables in `.env.local` (lub w zmiennych środowiskowych hostingu):
const livekitHost = process.env.LIVEKIT_URL!;
const livekitApiKey = process.env.LIVEKIT_API_KEY!;
const livekitApiSecret = process.env.LIVEKIT_API_SECRET!;

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
    if (livekitHost === undefined) {
      throw new Error("LIVEKIT_URL is not defined");
    }
    if (livekitApiKey === undefined) {
      throw new Error("LIVEKIT_API_KEY is not defined");
    }
    if (livekitApiSecret === undefined) {
      throw new Error("LIVEKIT_API_SECRET is not defined");
    }

    const { searchParams } = new URL(request.url);
    let roomName = searchParams.get("roomName");
    let participantIdentity = searchParams.get("participantName");
    const voice = searchParams.get("voice");

    if (!roomName) {
      roomName = `voice-assistant-room_${Math.floor(Math.random() * 10_000)}`;
      console.warn(`roomName not provided, generated random: ${roomName}`);
    }

    if (!participantIdentity) {
      participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
      console.warn(`participantName not provided, generated random: ${participantIdentity}`);
    }

    const token = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: participantIdentity,
    });

    let agentToDispatchName: string | undefined;
    if (voice === "female") {
      agentToDispatchName = "agent_female_nazwa";
    } else if (voice === "male") {
      agentToDispatchName = "agent_male_nazwa";
    }

    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    };

    if (agentToDispatchName) {
      grant.roomCreate = true; 
      
      const agentDispatchConfig: LiveKitProtocolRoomAgentDispatch = {
        agentName: agentToDispatchName,
      };
      
      const roomConfigForToken: LiveKitProtocolRoomConfiguration = {
        agents: [agentDispatchConfig],
      };
      
      // Assigning the manually constructed object that should be structurally compatible
      // with RoomConfiguration from '@livekit/protocol' as expected by token.roomConfig setter.
      token.roomConfig = roomConfigForToken as any; // Using 'as any' to bypass strict compile-time check if exact type is elusive to import/construct.
                                                // The runtime behavior depends on LiveKit server correctly interpreting this structure.
    }

    token.addGrant(grant);

    const participantToken = await token.toJwt();

    const data: ConnectionDetails = {
      serverUrl: livekitHost,
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
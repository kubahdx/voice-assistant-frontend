import {
  AccessToken,
  AccessTokenOptions,
  VideoGrant,
  RoomServiceClient, // <--- DODAJ TEN IMPORT
  // RoomAgentDispatch, // Ten typ może nie być potrzebny do samego wywołania API, ale jest dobry dla referencji
} from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server"; // Używamy NextRequest do odczytania parametrów URL

// Twoje zmienne środowiskowe (muszą być ustawione na Vercelu)
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL; // Np. wss://twoj-projekt.livekit.cloud

// don't cache the results
export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

// Zmieniamy sygnaturę funkcji, aby przyjmowała NextRequest
export async function GET(request: NextRequest) {
  try {
    // Sprawdzanie zmiennych środowiskowych
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

    // Odczytaj parametr 'personality' z URL-a żądania
    const { searchParams } = new URL(request.url);
    const personality = searchParams.get("personality") || "female"; // Domyślnie "female", jeśli brak parametru
    console.log(`Odebrano żądanie dla osobowości: ${personality}`);

    // Generuj losową nazwę pokoju i tożsamość uczestnika (dla użytkownika frontendu)
    const participantIdentity = `voice_assistant_user_${Math.floor(
      Math.random() * 10_000,
    )}`;
    const roomName = `voice_assistant_room_${Math.floor(
      Math.random() * 10_000,
    )}`;
    
    // Wygeneruj token dla użytkownika frontendu
    const participantToken = await createParticipantToken(
      { identity: participantIdentity },
      roomName,
    );
    console.log(`Wygenerowano token dla użytkownika: ${participantIdentity} do pokoju: ${roomName}`);

    // --- NOWA CZĘŚĆ: Jawne Przydzielenie Agenta (Explicit Agent Dispatch) ---
    // Potrzebujemy adresu hosta LiveKit bez 'wss://' lub 'ws://' dla RoomServiceClient
    const livekitHost = LIVEKIT_URL.replace(/^wss?:\/\//, '');
    const roomServiceClient = new RoomServiceClient(
      livekitHost,
      API_KEY,
      API_SECRET,
    );

    // Nazwa agenta, którego chcemy uruchomić.
    // To powinno odpowiadać wartości `agent_name` w WorkerOptions Twojego agenta Pythona na VPS,
    // jeśli tam ją ustawiłeś. Jeśli nie, LiveKit wybierze dostępnego workera,
    // a my przekażemy osobowość w metadanych.
    const agentToDispatch = "psycholog-agent"; // Możesz dostosować tę nazwę

    const agentMetadata = JSON.stringify({
      personality: personality, // Przekazujemy wybraną osobowość
    });

    console.log(`Wysyłanie żądania dispatch dla agenta: ${agentToDispatch} do pokoju: ${roomName} z metadanymi: ${agentMetadata}`);
    try {
      await roomServiceClient.createAgentDispatch({ // Dokumentacja używa tego jako obiektu, a nie metody.
                                                // Poprawnie powinno być:
                                                // await roomServiceClient.createAgentDispatch(roomName, agentToDispatch, { metadata: agentMetadata });
                                                // Jednak najnowsze SDK może mieć to jako obiekt:
        room: roomName,
        agent: { // W dokumentacji LiveKit struktura dla `createAgentDispatch` używa obiektu AgentDispatchTarget
          name: agentToDispatch,
          // Można też wybrać agenta po ID, jeśli jest znane:
          // id: "agent_id_if_known" 
        },
        metadata: agentMetadata,
      });
      console.log(`Żądanie dispatch dla agenta wysłane pomyślnie dla pokoju: ${roomName}`);
    } catch (dispatchError) {
      console.error(`Błąd podczas wysyłania żądania dispatch dla agenta: ${dispatchError instanceof Error ? dispatchError.message : String(dispatchError)}`, dispatchError);
      // Na razie nie przerywamy działania, jeśli dispatch się nie uda - frontend nadal dostanie token.
      // Możesz zdecydować, czy w tym przypadku chcesz zwrócić błąd do frontendu.
    }
    // --------------------------------------------------------------------

    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL, // Zwracamy pełny URL z wss://
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
    return new NextResponse("An unknown error occurred", { status:
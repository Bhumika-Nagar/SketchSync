"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Canvas from "./canvas/Canvas";
import { ChatRoomClient } from "./chatRoomClient";
import {
  type RoomEventListener,
  type RoomEventSubscriber,
  type RoomSocketPayload,
  type RoomSocketEvent,
  useSocket,
} from "../hooks/useSocket";
import { apiRequest } from "@/lib/api";

type RoomClientProps = {
  slug: string;
};

type RoomResponse = {
  room: {
    id: string;
    slug: string;
  };
  messages: { message: string }[];
};

function RoomClient({ slug }: RoomClientProps) {
  const { socket, loading } = useSocket();
  const listenersRef = useRef(new Set<RoomEventListener>());
  const [roomData, setRoomData] = useState<RoomResponse | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);
  const roomId = roomData?.room.id ?? null;

  const subscribeToRoomEvents = useCallback<RoomEventSubscriber>((listener) => {
    listenersRef.current.add(listener);

    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRoom = async () => {
      setIsLoadingRoom(true);
      setRoomError(null);

      try {
        const data = await apiRequest<RoomResponse>(
          "get",
          `/user/room-with-messages/${slug}`,
        );

        if (!cancelled) {
          setRoomData(data);
        }
      } catch {
        if (!cancelled) {
          setRoomError("Unable to load this room right now.");
          setRoomData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRoom(false);
        }
      }
    };

    loadRoom();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!socket || loading || !roomId) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "join_room",
        roomId,
      }),
    );

    const handleMessage = (event: MessageEvent<string>) => {
      const parsedData = JSON.parse(event.data) as Partial<RoomSocketPayload>;

      const notifyListeners = (roomEvent: Partial<RoomSocketPayload>) => {
        switch (roomEvent.type) {
          case "chat":
          case "draw":
          case "update":
          case "delete":
            listenersRef.current.forEach((listener) => {
              listener(roomEvent as RoomSocketEvent);
            });
            break;
          default:
            break;
        }
      };

      if (parsedData.type === "batch" && Array.isArray(parsedData.events)) {
        parsedData.events.forEach((roomEvent) => notifyListeners(roomEvent));
        return;
      }

      notifyListeners(parsedData);
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
      socket.send(
        JSON.stringify({
          type: "leave_room",
          roomId,
        }),
      );
    };
  }, [socket, loading, roomId]);

  return (
    <main className="min-h-screen bg-radial-gradient(circle_at_top,_rgba(37,99,235,0.2),_transparent_38%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%) px-4 py-6 text-slate-100 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.28em] text-blue-200/70">
            Room
          </p>
          <div className="mt-2 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">
                {roomData?.room.slug ?? slug}
              </h1>
              <p className="text-sm text-slate-400">
                {isLoadingRoom
                  ? "Loading room content without blocking navigation."
                  : roomError
                    ? roomError
                    : "Collaborative whiteboard with live chat and local drawing tools."}
              </p>
            </div>
            <p className="text-sm text-slate-500">
              Room ID: {roomId ?? "Loading..."}
            </p>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Canvas
            roomId={roomId}
            socket={socket}
            subscribeToRoomEvents={subscribeToRoomEvents}
          />
          <ChatRoomClient
            id={roomId}
            loading={isLoadingRoom}
            messages={roomData?.messages ?? []}
            socket={socket}
            subscribeToRoomEvents={subscribeToRoomEvents}
          />
        </div>
      </div>
    </main>
  );
}

export default memo(RoomClient);

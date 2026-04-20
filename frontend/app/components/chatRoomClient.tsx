"use client";

import { useEffect, useState } from "react";
import { type RoomSocketEvent, type RoomEventSubscriber } from "../hooks/useSocket";
import Input from "./ui/Input";
import Button from "./ui/Button";

export function ChatRoomClient({
  messages,
  id,
  socket,
  subscribeToRoomEvents,
}: {
  messages: { message: string }[];
  id: string;
  socket?: WebSocket;
  subscribeToRoomEvents: RoomEventSubscriber;
}) {
  const [chats, setChats] = useState(messages);
  const [currentMessage, setCurrentMessage] = useState("");

  useEffect(() => {
    return subscribeToRoomEvents((event: RoomSocketEvent) => {
      if (event.type === "chat") {
        setChats((currentChats) => [
          ...currentChats,
          { message: event.message },
        ]);
      }
    });
  }, [subscribeToRoomEvents]);

  return (
    <aside className="flex min-h-680px flex-col rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur">
      <div className="mb-5 border-b border-white/10 pb-4">
        <p className="text-xs uppercase tracking-[0.28em] text-blue-200/70">
          Chat
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">Room messages</h2>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {chats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-6 text-sm text-slate-400">
            No messages yet.
          </div>
        ) : (
          chats.map((chat, index) => (
            <div
              key={`${chat.message}-${index}`}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
            >
              {chat.message}
            </div>
          ))
        )}
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <Input
          type="text"
          value={currentMessage}
          placeholder="Send a message"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setCurrentMessage(event.target.value);
          }}
        />

        <Button
          onClick={() => {
            const message = currentMessage.trim();

            if (!message) {
              return;
            }

            socket?.send(
              JSON.stringify({
                type: "chat",
                roomId: id,
                message,
              }),
            );
            setCurrentMessage("");
          }}
        >
          Send message
        </Button>
      </div>
    </aside>
  );
}

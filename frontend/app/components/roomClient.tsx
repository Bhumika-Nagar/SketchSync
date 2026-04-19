"use client";

import Canvas from "./canvas/Canvas";
import { ChatRoomClient } from "./chatRoomClient";

type RoomClientProps = {
  roomId: string;
  messages: { message: string }[];
  slug: string;
};

export default function RoomClient({
  roomId,
  messages,
  slug,
}: RoomClientProps) {
  return (
    <main className="min-h-screen bg-radial-gradient(circle_at_top,_rgba(37,99,235,0.2),_transparent_38%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%) px-4 py-6 text-slate-100 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.28em] text-blue-200/70">
            Room
          </p>
          <div className="mt-2 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">{slug}</h1>
              <p className="text-sm text-slate-400">
                Collaborative whiteboard with live chat and local drawing tools.
              </p>
            </div>
            <p className="text-sm text-slate-500">Room ID: {roomId}</p>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Canvas />
          <ChatRoomClient id={roomId} messages={messages} />
        </div>
      </div>
    </main>
  );
}

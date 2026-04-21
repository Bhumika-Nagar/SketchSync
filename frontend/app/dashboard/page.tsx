"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoom } from "@/lib/room";

export default function Dashboard() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");

  const handleCreateRoom = async () => {
  try {
    const data = await createRoom();

    router.push(`/room/${data.roomId}`); 
  } catch (err) {
    console.error(err);
    alert("Failed to create room");
  }
};

const handleJoinRoom = () => {
  if (!roomId.trim()) {
    alert("Enter room ID");
    return;
  }

  router.push(`/room/${roomId}`); 
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md space-y-6 p-6 bg-gray-900 rounded-2xl border border-gray-800">

        <h1 className="text-2xl font-bold text-center text-blue-500">
          SketchSync
        </h1>

        
        <button
          onClick={handleCreateRoom}
          className="w-full py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          Create Room
        </button>

        <div className="text-center text-gray-500">OR</div>

        
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 outline-none"
          />

          <button
            onClick={handleJoinRoom}
            className="w-full py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            Join Room
          </button>
        </div>

      </div>
    </div>
  );
}
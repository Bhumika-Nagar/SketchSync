"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function Dashboard() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  return (
    <Card title="Join a Room">
      <Input
        value={roomId}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setRoomId(e.target.value)
        }
        placeholder="Enter Room ID"
      />

      <Button onClick={() => router.push(`/room/${roomId}`)}>
        Join Room
      </Button>
    </Card>
  );
}

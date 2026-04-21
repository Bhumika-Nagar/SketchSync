import RoomClient from "@/app/components/roomClient";
import { serverFetch } from "@/lib/serverApi";

type Room = {
  id: string;
  slug: string;
};

type Message = {
  message: string;
};

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const roomData = await serverFetch<{ room: Room }>(`/user/room/${slug}`);

  const room = roomData.room;

  if (!room) {
    throw new Error("Room not found");
  }

  const chatData = await serverFetch<{ messages: Message[] }>(`/user/chats/${room.id}`);

  const messages = chatData.messages ?? [];

  return (
    <RoomClient
      roomId={room.id}
      messages={messages}
      slug={slug}
    />
  );
}
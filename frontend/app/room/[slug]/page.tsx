import RoomClient from "@/app/components/roomClient";

const API_BASE_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function getRoom(slug: string) {
  const response = await fetch(`${API_BASE_URL}/user/room/${slug}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load room for slug: ${slug}`);
  }

  const data = await response.json();
  return data.room as { id: number; slug: string };
}

async function getChats(roomId: string) {
  const response = await fetch(`${API_BASE_URL}/user/chats/${roomId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load chats for room: ${roomId}`);
  }

  const data = await response.json();
  return (data.messages ?? []) as Array<{ message: string }>;
}

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;
  const room = await getRoom(slug);
  const messages = await getChats(String(room.id));

  return <RoomClient roomId={String(room.id)} messages={messages} slug={slug} />;
}

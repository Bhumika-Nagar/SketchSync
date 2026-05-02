import RoomClient from "@/app/components/roomClient";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <RoomClient slug={slug} />;
}

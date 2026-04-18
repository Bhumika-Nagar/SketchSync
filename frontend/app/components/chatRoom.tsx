import api from "@/lib/api";

async function getChats(roomId: string) {
    const response = await api.get('/chats/${roomId}');
    return response.data.messages
}

import { ChatRoomClient } from "./chatRoomClient";

export async function ChatRoom({ id }: { id: string }) {
    const messages = await getChats(id);

    return <ChatRoomClient id={id} messages={messages} />;
}
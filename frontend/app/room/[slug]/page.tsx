import api from "@/lib/api"
import { ChatRoom } from "@/app/components/chatRoom";
async function getRoomId(slug: string){
    const response= api.get(`/room/${slug}`)
    return (await response).data.room.id;
}

export default async function chatRoom1({
    params
}:{
    params:{
        slug:string
    }
}) {
    const slug= (await params).slug;
    const roomId = await getRoomId(slug);

    return ( <ChatRoom id={roomId}></ChatRoom> )
}
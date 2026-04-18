"use client"

import { useEffect, useState} from "react";
import { useSocket } from "../hooks/useSocket";
import Input from "./ui/Input";
import Button from "./ui/Button";

export function ChatRoomClient({
    messages,
    id
}:{
    messages: {message: string}[];
    id: string
}){
    const [chats, setChats] = useState(messages);
    const [currentMessage, setCurrentMessage]= useState("");
    const {socket, loading} = useSocket();

    useEffect(()=>{
        if(socket && !loading){
            socket.send(JSON.stringify({
                type:"join_room",
                roomId : id
            }))
            socket.onmessage= (event) =>{
                const parsedData = JSON.parse(event.data);
                if(parsedData.type ==="chat"){
                    setChats(c => [...c,{message: parsedData.message}])
                }
            }
        }
    },[socket, loading, id])

    return (
    <div>
      {chats.map((m, i) => (
        <div key={i}>{m.message}</div>
      ))}

      <Input
        type="text"
        value={currentMessage}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setCurrentMessage(e.target.value);
        }}
      />

      <Button
        onClick={() => {
          socket?.send(
            JSON.stringify({
              type: "chat",
              roomId: id,
              message: currentMessage,
            })
          );
          setCurrentMessage("");
        }}
      >
        Send message
      </Button>
    </div>
  );
}

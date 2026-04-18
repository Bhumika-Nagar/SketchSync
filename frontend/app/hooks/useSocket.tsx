import {useEffect, useState} from "react";

export function useSocket(){
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket>();

    useEffect(()=>{
        const ws = new WebSocket(process.env.WS_URL as string);
        ws.onopen = () =>{
            setLoading(false);
            setSocket(ws);
        }
    },[]);

    return{
        socket,
        loading
    }
}
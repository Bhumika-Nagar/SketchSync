import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { prismaClient } from "./db";
const wss= new WebSocketServer({ port: 8080 });

interface User{
  ws: WebSocket,
  rooms: string[],
  userId: string
}

const users: User[] = [];
function checkUser(token: string):string | null | undefined {
  const decoded= jwt.verify(token, process.env.JWT_SECRET as string);

  if(typeof decoded == "string"){
    
    return null;
  }

  if(!decoded || !decoded.userId){
    
    return null;
  }

  return decoded.userId;
}

wss.on('connection',function connection(ws, request){
  const url= request.url;
  if(!url){
    return;
  }

  const queryParams= new URLSearchParams(url.split('?')[1]);
  const token= queryParams.get('token') || "";
  const userId = checkUser(token);

  if(!userId){
    ws.close()
    return null;
  }

  users.push({
    userId,
    rooms:[],
    ws
  })
  
  ws.on('message',async function message(data){
    const parsedData = JSON.parse(data as unknown as string);

    if(parsedData.type === "join_room"){
      const user= users.find(x => x.ws === ws);
      user?.rooms.push(parsedData.roomId);
    }

    if(parsedData.type === "leave_room"){
      const user = users.find(x => x.ws === ws);
      if(!user){
        return;
      }
      user.rooms= user.rooms.filter((x) => x === parsedData.room);
    }

    if(parsedData.type == "chat"){
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      //dumb approach
      await prismaClient.chat.create({
        data:{
          roomId,
          message,
          userId
        }
      })

      users.forEach(user =>{
        if(user.rooms.includes(roomId)){
          user.ws.send(JSON.stringify({
            type:"chat",
            message:message,
            roomId
          }))
        }
      })

    }
    //use redux or singletons to maintain readablity of code

  });
})


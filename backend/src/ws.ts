import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { prismaClient } from "./db";
const wss= new WebSocketServer({ port: 8080 });

interface User{
  ws: WebSocket,
  rooms: string[],
  userId: string
}

type IncomingSocketMessage =
  | {
      type: "join_room";
      roomId: string;
    }
  | {
      type: "leave_room";
      roomId: string;
    }
  | {
      type: "chat";
      roomId: string;
      message: string;
    }
  | {
      type: "draw";
      roomId: string;
      shape: unknown;
    }
  | {
      type: "update";
      roomId: string;
      shapeId: string;
      updates: unknown;
    }
  | {
      type: "delete";
      roomId: string;
      shapeId: string;
    }
  | {
      type: "batch";
      events: IncomingSocketMessage[];
    };

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

function broadcastToRoom(roomId: string, payload: object) {
  users.forEach((user) => {
    if (user.rooms.includes(roomId)) {
      user.ws.send(JSON.stringify(payload));
    }
  });
}

async function handleSocketMessage(ws: WebSocket, parsedData: IncomingSocketMessage, userId: string) {
  if (parsedData.type === "batch") {
    for (const event of parsedData.events) {
      await handleSocketMessage(ws, event, userId);
    }
    return;
  }

  if (parsedData.type === "join_room") {
    const user = users.find((x) => x.ws === ws);
    if (user && !user.rooms.includes(parsedData.roomId)) {
      user.rooms.push(parsedData.roomId);
    }
    return;
  }

  if (parsedData.type === "leave_room") {
    const user = users.find((x) => x.ws === ws);
    if (!user) {
      return;
    }

    user.rooms = user.rooms.filter((x) => x !== parsedData.roomId);
    return;
  }

  if (parsedData.type === "chat") {
    await prismaClient.chat.create({
      data:{
        roomId: parsedData.roomId,
        message: parsedData.message,
        userId
      }
    });

    broadcastToRoom(parsedData.roomId, {
      type:"chat",
      message: parsedData.message,
      roomId: parsedData.roomId
    });
    return;
  }

  if (parsedData.type === "draw") {
    broadcastToRoom(parsedData.roomId, parsedData);
    return;
  }

  if (parsedData.type === "update") {
    broadcastToRoom(parsedData.roomId, parsedData);
    return;
  }

  if (parsedData.type === "delete") {
    broadcastToRoom(parsedData.roomId, parsedData);
  }
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
    const parsedData = JSON.parse(data as unknown as string) as IncomingSocketMessage;
    await handleSocketMessage(ws, parsedData, userId);
  });

  ws.on("close", () => {
    const userIndex = users.findIndex((user) => user.ws === ws);
    if (userIndex !== -1) {
      users.splice(userIndex, 1);
    }
  });
})


import express from "express";
import { registerUserSchema } from "../validators/userValidation";
import bcrypt from "bcrypt";
import {authMiddleware} from "../middlewares/authMiddleware"
import { prismaClient } from "../db";
import {createRoomSchema} from "../validators/roomValidation";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
const router = express.Router();

import { Request } from "express";

export interface AuthRequest extends Request {
  userId?: string;
}

router.post("/signup", async(req, res)=>{
      const{email,name,password} = req.body;

      const success= registerUserSchema.safeParse(req.body);
      if(!success){
        return res.status(404).json({
          message:"invalid credentials"
        })
      }

      const existinguser= await prismaClient.user.findUnique({
        where:{email}
      })

      if(existinguser){
        return res.status(409).json({
          messgae:"email is already registered"
        })
      }

      const hashedPassword= await bcrypt.hash(password, 10);
      const user= await prismaClient.user.create({
        data:{
          email,
          name,
          password:hashedPassword
        },
      })

      const userId= user.id;
      const token= jwt.sign(
        {userId},
        process.env.JWT_SECRET as string
      )

      res.json({
        message:"user registered successfully",
        token
      })
});

router.post("/signin", async(req,res)=>{
      const {email, password}= req.body;

      const user= await prismaClient.user.findUnique({
        where: {email}
      })
      if(!user){
        return res.status(400).json({
          message:"invalid credentials"
        })
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if(!isMatch){
        return res.status(400).json({
          message:"invalid credentials"
        })
      }

      const token = jwt.sign(
        {userId: user.id},
        process.env.JWT_SECRET as string
      )

      res.json({
        message:"user signed in successfully",
        token
      })
});

router.post("/room", authMiddleware, async (req: AuthRequest, res) => {
  try {
    
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const slug = uuidv4();

    const room = await prismaClient.room.create({
      data: {
        slug,
        createdBy: req.userId,
      }
    });

    res.json({
      roomId: slug  
    });

  } catch (err: any) {
    console.error("CREATE ROOM ERROR:", err);

    res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
});


router.get("/chats/:roomId", async (req, res) => {
    const roomId = (req.params.roomId);
    const messages= await prismaClient.chat.findMany({
      where:{
        roomId: roomId
      },
      orderBy:{
        id: "desc"
      },
      take:50
    });
    res.json({
      messages
    })
})

router.get("/room/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;

    const room = await prismaClient.room.findFirst({
      where: { slug }
    });

    if (!room) {
      return res.status(404).json({
        message: "Room not found"
      });
    }

    res.json({ room });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error"
    });
  }
});

router.get("/room-with-messages/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;

    const room = await prismaClient.room.findUnique({
      where: { slug },
      include: {
        chats: {
          select: {
            message: true,
          },
          orderBy: {
            id: "desc",
          },
          take: 50,
        },
      },
    });

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    const { chats, ...roomData } = room;

    res.json({
      room: roomData,
      messages: chats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

//room permissions
//rate limiting
//propogate to a queue to make it faster
export default router;

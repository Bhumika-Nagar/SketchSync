import express from "express";
import { registerUserSchema } from "../validators/userValidation";
import bcrypt from "bcrypt";
import { prisma } from "../src/db";
import jwt from "jsonwebtoken";
const router = express.Router();

router.post("/register", async(req, res)=>{
      const{email,name,password} = req.body;

      const success= registerUserSchema.safeParse(req.body);
      if(!success){
        return res.status(404).json({
          message:"invalid credentials"
        })
      }

      const existinguser= await prisma.user.findUnique({
        where:{email}
      })
      if(existinguser){
        return res.status(404).json({
          messgae:"email is already registered"
        })
      }

      const hashedPassword= await bcrypt.hash(password, 10);
      const user= await prisma.user.create({
          email,
          name,
          password:hashedPassword
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

      const user= await prisma.user.findUnique({
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


export default router;
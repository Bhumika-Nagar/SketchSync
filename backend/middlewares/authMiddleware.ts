import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
    userId?: string;
}

export function authMiddleware(req:AuthRequest, res:Response, next:NextFunction){
    const token= req.headers["authorization"];

    if (!token || !process.env.JWT_SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded= jwt.verify(token, process.env.JWT_SECRET);
    if(decoded && typeof decoded !== 'string'){
        req.userId = decoded.userId;
        next();
    }
    else{
        res.status(403).json({
            message:"Unauthorized"
        })
    }
}
import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { SECRET } from "../global";
import { realpathSync } from "fs";

interface JwtPayLoad {
    id: string;
    username: string;
    role: string;
}

export const verifyToken = (request: Request, response: Response, next: NextFunction) => {
    const token = request.headers.authorization?.split(` `)[1];

    if (!token) {
        return response.status(403).json({ massage : `Access ditolak. tidak ada token yang tersedia`});
    }

    try{
        const secretKey = SECRET || ""
        const decoded = verify(token, secretKey);
        request.body.user = decoded as JwtPayLoad;
        next();
    }catch (error){
        return response.status(401).json({ massage: `tokennya salah`})
    }
};

export const verifyRole = (allowedRoles: string[]) => {
    return (request: Request, response: Response, next: NextFunction) => {
        const user = request.body.user;

        if (!user) {
            return response.status(403).json({ massage: `No user information available`});
        }

        if (!allowedRoles.includes(user.role)) {
            return response.status(403).json({ massage: `Access denied. Requires one of the following roles: ${allowedRoles.join(`, `)}`});
        }

        next();
    }
}
import { Request, Response } from "express"; 
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { request } from "http";

const prisma = new PrismaClient ({ errorFormat: "pretty" }) //membuat objek baru 

export const getAllMenus = async (request: Request, response: Response) => {
    try {
        //input 
        const { search } = request.query
        //main 
        const allMenus = await prisma.menu.findMany({
            where: {name: { contains: search?.toString() || ""}}
        })
        //output
        return response.json({
            status: true,
            data: allMenus,
            massage: `Menus has rettrived`
        }).status(200)
    } catch (error) {
        return response
            .json({
                status: false, 
                massage: `There is an error. ${error}`
            })
            .status(400)
    }
}
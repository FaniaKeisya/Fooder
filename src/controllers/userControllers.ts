import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { BASE_URL, SECRET } from "../global";
import fs, { realpathSync } from "fs";
import md5 from "md5";
import { sign } from "jsonwebtoken";

const prisma = new PrismaClient({ errorFormat: 'pretty'});

export const getAllUser = async (request: Request, response: Response) => {
    try{ 
        const {search} = request.query;

        const allUser = await prisma.user.findMany({
            where: {username: { contains: search?.toString() || ""}},
        });

        return response.json({
            status: true,
            massage: `User berhasil ditambahkan`,
            response: allUser
        }).status(200)
    } catch (error) {
        return response.json({
            status: false,
            massage: `There is an error. ${error}`,
        })
        .status(200)
    }
}

export const createUser = async (request: Request, response: Response) => {
    try{
        const { username, password, role } = request.body;

        const newUser = await prisma.user.create({
            data: { username, password: md5(password), role},
        });

        return response.json({
            status: true,
            massage: `User berhasil ditambahkan`,
            data: newUser
        }).status(200)
    } catch (error) {
        return response.json({
            status: false,
            massage: `There is an error. ${error}`
        })
        .status(400);
    }
}

export const updateUser = async (request: Request, response: Response) => {
    try {
        const {id} = request.params;
        const { username, password, role } = request.body;

        const findUser = await prisma.user.findFirst({ where: {id: Number(id)}})
        if (!findUser)
            return response
              .status(200)
              .json({ status: false, massage: `User gaada`});

        const updateUser = await prisma.user.update({
            data: {
                username: username ? username : findUser.username,
                password: md5(password) || findUser.password,
                role: role || findUser.role,
            },
            where: {id: Number(id)},
        });

        return response.json({
            status: true,
            massage: `User sudah diperbarui`,
            data: updateUser
        }).status(200)
    } catch (error) {
        return response.json({
            status: false,
            massage: `USERNAME SUDAH ADA.                                                                                ${error}`
        })
        .status(400)
    }
};

export const deleteUser = async (request: Request, response: Response) => {
    try{ 
        const {id} = request.params;

        const findUser = await prisma.user.findFirst({where: {id: Number(id)}})
        if (!findUser)
            return response
              .status(200)
              .json({ status: false, massage: `Usernya gaada bro`});

        const deletedUser = await prisma.user.delete({
            where: {id: Number(id)},
        });

        return response.json({
            status: true,
            massage: `User udah dihapus`,
            data: deletedUser,
        }).status(200)
    } catch (error) {
        return response.json({
            status: false,
            massage: `There is an error. ${error}`
        })
        .status(400)
    }
}

export const authentication = async (request: Request, response: Response) => {
    try {
        const { username, password } = request.body;

        const findUser = await prisma.user.findFirst({
            where: { username, password: md5(password) }
        });

        if (!findUser)
            return response
              .status(200)
              .json({
                status: false,
                logged: false,
                massage: `Username atau password ga valdi`,
            });

        let data = {
            id: findUser.id,
            username: findUser.username,
            role: findUser.role,
        };

        let payload = JSON.stringify(data)

        let token = sign(payload, SECRET || "token");

        return response.status(200).json({
            status: true,
            logged: true,
            massage: `Akhirnya berhasil login`,
            token,
        });
    } catch (error) {
        return response.json({
            status: false,
            massage: `There is an error. ${error}`,
        })
        .status(400)
    }
}
import { Request, Response } from "express"; 
import { PrismaClient } from "@prisma/client"; //untuk mendapatkan model atau data dalam database (mengakses skema yang sudah dibuat)
import { BASE_URL } from "../global";

const prisma = new PrismaClient ({ errorFormat: "pretty" }) //membuat objek baru (prisma) dari prismaclient

export const getAllBarang = async (request: Request, response: Response) => {
    try {
        const { id } = request.params
        const allBarang  = await prisma.barang.findUnique({
            where: { id: Number(id)}
        })

        return response.json ({
            status: true,
            massage: `Barang berhasil ditampilkan`,
            data: allBarang
        }).status(200)
    } catch (error) {
        return response.json({
            status: false,
            massage: `There is an error, ${error}`
        })
        .status(400)
    }
}

export const createBarang = async (request: Request, response: Response) => {
    try {
        const { namaBarang, location, category, quantity} = request.body

        const newBarang = await prisma.barang.create({
            data: { namaBarang, location, category, quantity: Number(quantity)}
        })

        return response.json ({
            status: true,
            massage: `Barang berhasil ditambahkan`,
            data: newBarang
        }).status(200)
    } catch (error) {
        return response.json ({
            status: false,
            massage: `There is an error. ${error}`
        })
        .status(400)
    }
}

export const updateBarang = async (request: Request, response: Response) => {
    try {
        const {id} = request.params
        const { namaBarang, location, category, quantity} = request.body

        const findBarang = await prisma.barang.findFirst({where: {id: Number(id)}})
        if (!findBarang) return response
            .status(200)
            .json({status: false, massage: `Barangnya ga ketemu bos`})

        const updateBarang = await prisma.barang.update({
            data: {
                namaBarang: namaBarang || findBarang.namaBarang,
                location: location || findBarang.location,
                category: category || findBarang.category,
                quantity: quantity ? Number(quantity) : findBarang.quantity,
            },
            where: {id: Number(id)}
        })
        return response.json({
            status: true, 
            massage: `Barang berhasil diUbah`,
            data: updateBarang
        }).status(200)
    } catch (error) {
        return response.json({
            status: false,
            massage: `There is an error. ${error}`
        })
        .status(400)
    }
}

export const deleteBarang = async (request: Request, response: Response) => {
    try{ 
        const {id} = request.params

        const findBarang = await prisma.barang.findFirst({where: {id: Number(id)}})
        if (!findBarang) return response
            .status(200)
            .json({status: false, massage: `Barangnya ga ketemu bos`})
        
        const deletedBarang = await prisma.barang.delete({
            where: {id: Number(id)}
        })

        return response.json({
            status: true, 
            data: deletedBarang,
            massage: `Barang berhasil dihapus`
        }).status(200)
    } catch (error) {
        return response.json({
            status: false,
            massage: `There is an error. ${error}`
        })
        .status(400)
    }
}
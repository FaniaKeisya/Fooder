import { NextFunction, Request, Response } from "express";
import { realpathSync } from "fs";
import Joi, { number } from "joi";
import { join } from "path";

const addDataSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(3).alphanum().required(),
    role: Joi.string().valid(`karyawan`, `siswa`).required()
})

const editDataSchema = Joi.object({
    username: Joi.string().optional(),
    password: Joi.string().optional(),
    role: Joi.string().valid(`karyawan`, `siswa`).optional()
})

const authSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(3).alphanum().required(),
})

export const verifyAuthentication = (request: Request, response: Response, next: NextFunction) => {
    const {error} = authSchema.validate(request.body, {abortEarly: false})

    if (error) {
        return response.status(400).json({
            status: false,
            massage: error.details.map((it) => it.message).join(),
        })
    }
    return next()
}

export const verifyAddUser = (request: Request, response: Response, next: NextFunction) => {
    const { error } = addDataSchema.validate(request.body, { abortEarly: false })

    if (error) {
        return response.status(400).json({
            status: false,
            massage: error.details.map(it => it.message).join()
        })
    }
    return next()
}

export const verifyEditUser = (request: Request, response: Response, next: NextFunction) => {
    const {error} = editDataSchema.validate(request.body, {abortEarly: false})

    if (error) {
        return response.status(400).json({
            status: false,
            massage: error.details.map(it => it.message).join()
        })
    }
    return next()
}
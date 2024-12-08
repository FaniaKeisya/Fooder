import { NextFunction, Request, Response } from "express";
import Joi from "joi";

const borrowSchema = Joi.object({
    idUser: Joi.number().required(),
    idBarang: Joi.number().required(),
    borrowDate: Joi.date().iso().required(),
    returnDate: Joi.date().iso().min(Joi.ref('borrowDate')).required(),
    user: Joi.optional()
})

const returnSchema = Joi.object({
    idBorrow: Joi.number().required(),
    returnDate: Joi.date().iso().required(),
    status: Joi.string().valid("kembali").required(),
    user: Joi.optional()
})

export const validateBorrow = (request: Request, response: Response, next: NextFunction) => {
    const {error} = borrowSchema.validate(request.body);

    if (error) {
        return response.status(400).json({
            status: false,
            massage: error.details.map(it => it.message).join(),
        });
    }
    next()
}

export const validateReturn = (request: Request, response: Response, next: NextFunction) => {
    const {error} = returnSchema.validate(request.body)

    if (error) {
        return response.status(400).json({
            status: false,
            massage: error.details.map(it => it.message).join(),
        })
    }
    next();
}

const analisisSchema = Joi.object({
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().required().greater(Joi.ref("start_date")),
    group_by: Joi.string().valid("category","location").required(),
    user: Joi.optional(),
});

export const validateAnalis = (request: Request, response: Response, next: NextFunction) => {
    const { error } = analisisSchema.validate(request.body);
    if (error) {
        return response.status(400).json({
            status: false,
            massage: error.details.map(it => it.message).join(),
        });
    }
    next();
};

const analisisBorrowSchema = Joi.object({
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().required().greater(Joi.ref("start_date")),
    user: Joi.optional(),
});

export const validateBorrowAnalis = (req: Request, res: Response, next: NextFunction) => {
    const { error } = analisisBorrowSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            status: false,
            massage: error.details.map(it => it.message).join(),
        });
    }
    next();
};
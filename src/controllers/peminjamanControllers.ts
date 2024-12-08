import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { userInfo } from "os";
import { itxClientDenyList } from "@prisma/client/runtime/library";
import { json } from "stream/consumers";
import { when } from "joi";

const prisma = new PrismaClient({ errorFormat: "pretty"});

export const getAllPeminjaman = async (request: Request, response: Response) => {
    try {
        const getAllpinjam = await prisma.peminjaman.findMany({
            include: {
                user: true,     //menyertakan informasi user
                barang: true    //menyertakan informasi barang
            }
        })
        return response.json({
            status: true,
            message: `Data peminjaman berhasil ditampilkan`,
            data: getAllpinjam,
        }).status(200)
    } catch (error) {
        return response.json({
            status: false,
            message: `Terdapat sebuah kesalahan ${error}`
        }).status(400)
    }
}

export const borrowBarang = async (request: Request, response: Response) => {
    try {
        const { idUser, idBarang, borrowDate, returnDate} = request.body;
        const quantity = 1;

        const findUser = await prisma.user.findFirst({
            where: {id: Number(idUser)},
        });

        if (!findUser) return response 
            .status(200)
            .json({ status: false, massage: `Usernya gaada`})

        const findBarang = await prisma.barang.findFirst({
            where: {id: Number(idBarang)}
        });

        if (!findBarang) return response 
            .status(200)
            .json({status: false, massage: `Barangnya gaada`})

        //mengecek kuantitas barang sebelum peminjaman 
        const barang = await prisma.barang.findUnique({
            where: { id: Number(idBarang)},
            select: { quantity: true }
        });

        if (!barang || barang.quantity === 0) {
            return response
                .status(400)
                .json({ status: false, massage: `barangnya lum ready`})
        }

        const newBorrow = await prisma.peminjaman.create({
            data: {
                idUser: Number(idUser),
                idBarang: Number(idBarang),
                quantity: Number(quantity),
                borrowDate: new Date(borrowDate),
                returnDate: new Date(returnDate)
            }
        })

        // biar klo dipinjam, stok barangnya mengurang ?
        const updateBarang = await prisma.barang.update({
            where: {id: Number(idBarang)},
            data: { quantity: {decrement: Number(quantity)}}
        })
        
        return response
            .status(200)
            .json({
                status: true,
                massage: `Peminjaman berhasil dicatat`,
                data: newBorrow
            }).status(200)
    } catch (error) {
        return response.json({
            status: false,
            massage: `Terjadi kesalahan. ${(error as Error).message}`
        })
        .status(400)
    }
}

export const returnBarang = async (request: Request, response: Response) => {
    try {
        const {idBorrow, returnDate, status, quantity} = request.body

        const peminjaman = await prisma.peminjaman.findUnique({
            where:{id: Number(idBorrow)},
            select: {quantity: true, status: true, idBarang: true},
        })

        if (!peminjaman) {
            return response
            .status(404)
            .json({status: false, massage: `Data peminjaman tidak ditemukan`})
        }

        if (peminjaman.status === 'kembali'){
            return response
                .status(400)
                .json({status: false, massage: `Sudah balik`})
        }

        const updatePeminjaman = await prisma.peminjaman.update({
            where: {id: Number(idBorrow)},
            data: {
                returnDate: new Date(returnDate),
                status: status,
            }
        })

        const updateBarang = await prisma.barang.update({
            where: {id: Number(peminjaman.idBarang),},
            data: {
                quantity: {
                    increment: peminjaman.quantity
                }
            }
        })

        return response.json({
            status: true,
            massage: `Pengembalian barang berhasil dicatat`,
            data: updatePeminjaman
        }).status(200)
    } catch (error) {
        return response.json({
            status: false,
            massage: `Terjadi kesalahan. ${error}`
        })
        .status(400)
    }
}

export const analisis = async (request: Request, response: Response) => {
    const { start_date, end_date, group_by } = request.body;

    // Validasi input
    if (!start_date || !end_date || !group_by) {
        return response.status(400).json({
            status: false,
            message: `Tanggal mulai, tanggal akhir, dan kriteria pengelompokkan harus diisi`,
        });
    }

    // Validasi format tanggal
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return response.status(400).json({
            status: false,
            message: `Format tanggal tidak valid`,
        });
    }

    try {
        let usageReport;
        let additionalInfo: Array<{ id: number; [key: string]: any }> = [];

        if (group_by === 'category') {
            usageReport = await prisma.peminjaman.groupBy({
                by: ['idBarang'],
                where: { borrowDate: { gte: startDate } },
                _count: { idBarang: true },
            });

            const ids = usageReport.map(item => item.idBarang);
            additionalInfo = await prisma.barang.findMany({
                where: { id: { in: ids } },
                select: { id: true, category: true },
            });
        } else if (group_by === 'location') {
            usageReport = await prisma.peminjaman.groupBy({
                by: ['idBarang'],
                where: { borrowDate: { gte: startDate } },
                _count: { idBarang: true },
            });

            const ids = usageReport.map(item => item.idBarang);
            additionalInfo = await prisma.barang.findMany({
                where: { id: { in: ids } },
                select: { id: true, location: true },
            });
        } else {
            return response.status(400).json({
                status: false,
                message: `Kriteria pengelompokan tidak valid. Gunakan "category" atau "location".`,
            });
        }

        const returnedItems = await prisma.peminjaman.groupBy({
            by: ['idBarang'],
            where: {
                borrowDate: { gte: startDate },
                returnDate: { gte: startDate, lte: endDate },
                status: 'kembali',
            },
            _count: { idBarang: true },
        });

        // Menghitung peminjaman yang belum dikembalikan
        const usageAnalysis = usageReport.map(item => {
            const info = additionalInfo.find(info => info.id === item.idBarang);
            const returnedItem = returnedItems.find(returned => returned.idBarang === item.idBarang);
            const totalReturned = returnedItem?._count?.idBarang ?? 0;
            const itemsInUse = item._count.idBarang - totalReturned;

            return {
                group: info ? info[group_by as keyof typeof info] || 'Unknown' : 'Unknown',
                total_borrowed: item._count.idBarang,
                total_returned: totalReturned,
                items_in_use: itemsInUse,
            };
        });

        response.status(200).json({
            status: true,
            data: {
                analysis_period: {
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                },
                usage_analysis: usageAnalysis,
            },
            message: `Laporan penggunaan barang berhasil dihasilkan`,
        });
    } catch (error) {
        response.status(500).json({
            status: false,
            message: `Terjadi kesalahan: ${(error as Error).message}`,
        });
    }
};



export const borrowAnalysis = async (request: Request, response: Response) => {
    const { start_date, end_date } = request.body;

    //validasi input
    if (!start_date || !end_date){
        return response.status(400).json({
            status: false,
            message: `Tanggal mulai dan tanggal akhir harus diisi`,
        });
    }

    //validasi format tanggal
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return response.status(400).json({
            status: false,
            message: `Format tanggal tidak valid`,
        });
    }

    try {
        const frequentlyBorrowedItems = await prisma.peminjaman.groupBy({
            by: ['idBarang'],
            where: {
                borrowDate: {
                    gte: startDate,
                },
                returnDate: {
                    lte: endDate,
                },
            },
            _count: {
                idBarang: true,
            },
            orderBy: {
                _count: {
                    idBarang: 'desc',
                }
            },
        });

        //informasi brang yg sering dipinjam 
        const frequentlyBorrowedItemDetails = await Promise.all(frequentlyBorrowedItems.map(async item => {
            const barang = await prisma.barang.findUnique({
                where: { id: item.idBarang },
                select: { id: true, namaBarang: true, category: true },
            });
            return barang ? {
                item_id: item.idBarang,
                name: barang.namaBarang,
                category: barang.category,
                total_borrowed: item._count.idBarang,
            } : null;
        })).then(results => results.filter(item => item !== null)); //menghapus item yang null

        const inefficientItems = await prisma.peminjaman.groupBy({
            by: ['idBarang'],
            where: {
                borrowDate: {
                    gte: startDate,
                },
                returnDate: {
                    gt: endDate //asumsikan telat pengembalian adalah jika returnDate lebih besar dari endDate
                }
            },
            _count: {
                idBarang: true,
            },
            _sum: {
                quantity: true,
            },
            orderBy: {
                _count: {
                    idBarang: 'desc',
                }
            },
        });

        //mendapatkan informasi untuk barang yang telat pengembalian 
        const inefficientItemsDetails = await Promise.all(inefficientItems.map(async item => {
            const barang = await prisma.barang.findUnique({
                where: { id: item.idBarang },
                select : { id: true, namaBarang: true, category: true},
            });
            return barang ? {
                item_id: item.idBarang,
                name: barang.namaBarang,
                category: barang.category,
                total_borrowed: item._count.idBarang,
                total_late_returns: item._sum.quantity ?? 0, //menangani kemungkinan nilai underfined
            } : null;
        })).then(results => results.filter(item => item !== null)); //menghapus item yang null

        response.status(200).json({
            status: true,
            data: {
                analysis_period: {
                    startDate: start_date,
                    end_date: end_date
                },
                frequently_borrowed_items : frequentlyBorrowedItemDetails,
                inefficient_items: inefficientItems
            },
            message: `Analisis barang berhasil dihasilkan`,
        });
    } catch (error) {
        response.status(500).json({
            status: false,
            message: `Terjasi kesalahan. ${(error as Error).message}`,
        });
    }
}
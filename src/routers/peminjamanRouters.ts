import express  from "express";
import { validateBorrow, validateReturn, validateAnalis, validateBorrowAnalis } from "../middlewares/verifyPeminjaman";
import { getAllPeminjaman, borrowBarang, returnBarang, analisis, borrowAnalysis, } from "../controllers/peminjamanControllers";
import { verifyRole, verifyToken } from "../middlewares/authorization";

const app = express()
app.use(express.json())

app.get("/get", [verifyToken, verifyRole(["karyawan"]), getAllPeminjaman]);
app.post("/borrow", [verifyToken, verifyRole(["karyawan", "siswa"]), validateBorrow], borrowBarang);
app.post("/return", [verifyToken, verifyRole(["karyawan", "siswa"]), validateReturn], returnBarang);
app.post("/usage-report",[verifyToken,verifyRole(["karyawan"]),validateAnalis],analisis);
app.post("/borrow-analysis",[verifyToken,verifyRole(["karyawan"]),validateBorrowAnalis],borrowAnalysis);

export default app;
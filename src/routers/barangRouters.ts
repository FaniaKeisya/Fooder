import express from "express";
import { getAllBarang, createBarang, updateBarang, deleteBarang } from "../controllers/barangControllers";
import { verifyAddBarang, verifyEditBarang } from "../middlewares/verifyBarang";
import { verifyRole, verifyToken } from "../middlewares/authorization";

const app = express();
app.use(express.json());

// klo butuh login dikasih verifyToken, klo ga butuh ya gausa jir
app.get(`/:id`, [verifyToken, verifyRole (["karyawan", "siswa"])],getAllBarang);
app.post(`/`, [verifyToken, verifyRole (["karyawan"]), verifyAddBarang], createBarang);
app.put(`/:id`,[verifyToken, verifyRole (["karyawan"]), verifyEditBarang], updateBarang);
app.delete(`/:id`,[verifyToken, verifyRole(["karyawan"])], deleteBarang);

export default app;    
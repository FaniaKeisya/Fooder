import express  from "express";
import { getAllUser, createUser, updateUser, deleteUser, authentication } from "../controllers/userControllers";
import { verifyAddUser, verifyAuthentication, verifyEditUser } from "../middlewares/verifyUser";
import { verifyRole, verifyToken } from "../middlewares/authorization"

const app = express();
app.use(express.json());

app.get(`/`, getAllUser);
app.post(`/login`, [verifyAuthentication], authentication);
app.post(`/`, [verifyAddUser], createUser);
app.put(`/:id`, [verifyEditUser], updateUser);
app.delete(`/:id`, deleteUser);

export default app;
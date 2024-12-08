import express from 'express'
import cors from 'cors'
import BarangRoute from './routers/barangRouters'
import UserRoute from './routers/userRouters'
import pinjamRoute from './routers/peminjamanRouters'

const PORT: number = 8000
const app = express()
app.use(cors())

app.use('/api/barang', BarangRoute)
app.use('/api/auth', UserRoute)
app.use('/api/inventory', pinjamRoute)

app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`)
})
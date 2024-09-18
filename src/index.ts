import express from 'express'
import cors from 'cors'
import MenuRoute from './routers/routers'

const PORT: number = 8000
const app = express()
app.use(cors())

app.use('/menu', MenuRoute)

app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`)
})
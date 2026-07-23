import express from "express"
import cors from "cors"
import authRoutes from "./routes/authRoutes"
import transactionsRoutes from "./routes/transactionsRoutes"
import categoriesRoutes from "./routes/categoriesRoutes"
import accountsRoutes from "./routes/accountsRoutes"
import summaryRoutes from "./routes/summaryRoutes"
import goalsRoutes from "./routes/goalsRoutes"
import investmentsRoutes from "./routes/investmentsRoutes"
import ocrRoutes from "./routes/ocrRoutes"
import creditCardsRoutes from "./routes/creditCardsRoutes"

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))

app.use("/api/auth", authRoutes)
app.use("/api/transactions", transactionsRoutes)
app.use("/api/categories", categoriesRoutes)
app.use("/api/accounts", accountsRoutes)
app.use("/api/summary", summaryRoutes)
app.use("/api/goals", goalsRoutes)
app.use("/api/investments", investmentsRoutes)
app.use("/api/ocr", ocrRoutes)
app.use("/api/credit-cards", creditCardsRoutes)

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`)
})
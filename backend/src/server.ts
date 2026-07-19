import express from "express"
import cors from "cors"
import authRoutes from "./routes/authRoutes"

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

// Routes
app.use("/api/auth", authRoutes)

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})

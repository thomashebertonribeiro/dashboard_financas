import { Router, Request, Response } from "express"
import { loginUser, registerUser, verifyToken } from "../auth"

const router = Router()

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha sao obrigatorios" })
    }
    const result = await loginUser(email, password)
    return res.json(result)
  } catch (err: any) {
    return res.status(401).json({ error: err.message || "Credenciais invalidas" })
  }
})

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha sao obrigatorios" })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" })
    }
    await registerUser(email, password)
    // Auto-login after registration
    const result = await loginUser(email, password)
    return res.json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Erro ao registrar" })
  }
})

router.get("/me", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token ausente" })
  }
  const token = authHeader.split(" ")[1]
  try {
    const user = await verifyToken(token)
    return res.json({ user: { id: user.id, email: user.email } })
  } catch (err: any) {
    return res.status(401).json({ error: "Token invalido" })
  }
})

export default router

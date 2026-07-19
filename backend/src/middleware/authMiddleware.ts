import { Request, Response, NextFunction } from "express"
import { verifyToken } from "../auth"

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token ausente" })
  }
  const token = authHeader.split(" ")[1]
  try {
    const user = await verifyToken(token)
    ;(req as any).user = user
    next()
  } catch (e) {
    return res.status(401).json({ error: "Token invalido" })
  }
}

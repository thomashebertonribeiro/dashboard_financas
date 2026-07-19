import { Router, Request, Response } from "express"
import { supabase } from "../auth"
import { authMiddleware } from "../middleware/authMiddleware"

const router = Router()

// All transaction routes require authentication
router.use(authMiddleware)

// Get all transactions for the logged in user
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })

    if (error) throw error

    return res.json({ data })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal Server Error" })
  }
})

// Create a single transaction or multiple (for import)
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const payload = req.body

    let insertData = []
    if (Array.isArray(payload)) {
      insertData = payload.map((t: any) => ({ ...t, user_id: userId }))
    } else {
      insertData = [{ ...payload, user_id: userId }]
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert(insertData)
      .select()

    if (error) throw error

    return res.status(201).json({ data })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal Server Error" })
  }
})

// Update a transaction
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const transactionId = req.params.id
    const payload = req.body

    const { data, error } = await supabase
      .from("transactions")
      .update(payload)
      .eq("id", transactionId)
      .eq("user_id", userId) // Safety check, though RLS handles it
      .select()

    if (error) throw error

    return res.json({ data })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal Server Error" })
  }
})

// Delete a transaction
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const transactionId = req.params.id

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId)
      .eq("user_id", userId)

    if (error) throw error

    return res.status(204).send()
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal Server Error" })
  }
})

export default router

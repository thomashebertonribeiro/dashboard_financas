import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function registerUser(email: string, password: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  return data
}

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return {
    token: data.session?.access_token,
    user: { id: data.user?.id, email: data.user?.email },
  }
}

export async function verifyToken(token: string) {
  const { data, error } = await supabase.auth.getUser(token)
  if (error) throw error
  return data.user
}

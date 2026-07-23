import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve, join } from "path"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórios")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigrations() {
    const migrationsDir = resolve(__dirname, "../migrations")
    const files = ["001_initial_schema.sql"]
    // ^ Adicione novos arquivos aqui conforme criar novas migrations

    for (const file of files) {
        const path = join(migrationsDir, file)
        console.log(`▶ Executando ${file}...`)
        const sql = readFileSync(path, "utf-8")

        const { error } = await supabase.rpc("exec_sql", { sql })

        if (error) {
            // Fallback: tenta via REST API raw
            console.log(`  ⚠ RPC não disponível, tentando via query direta...`)
            const { error: directError } = await supabase
                .from("_migrations")
                .select("id")
                .limit(1)
                .maybeSingle()

            if (directError && directError.message.includes("does not exist")) {
                console.log(`  ⚠ Tabela _migrations não existe. Execute o SQL manualmente no console do Supabase.`)
                console.log(`  📄 Caminho: ${path}`)
                console.log(`  💡 Dica: Cole o conteúdo no SQL Editor do Supabase Dashboard`)
            } else {
                console.error(`  ❌ Erro: ${error.message}`)
                process.exit(1)
            }
        } else {
            console.log(`  ✅ ${file} executado com sucesso`)
        }
    }

    console.log("\n✅ Migrations concluídas!")
}

runMigrations().catch(err => {
    console.error("❌ Erro fatal:", err)
    process.exit(1)
})
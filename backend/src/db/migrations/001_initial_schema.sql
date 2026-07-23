-- ============================================================
-- Migration 001: Initial Schema
-- Finanças Pessoais — 9 tabelas + RLS + índices + migrações
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Função auxiliar para criar policy se não existir
-- ============================================================
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    policy_name TEXT,
    table_name TEXT,
    operation TEXT,
    using_clause TEXT,
    check_clause TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE policyname = policy_name AND tablename = table_name
    ) THEN
        IF check_clause IS NOT NULL THEN
            EXECUTE format(
                'CREATE POLICY %I ON %I FOR %s USING (%s) WITH CHECK (%s)',
                policy_name, table_name, operation, using_clause, check_clause
            );
        ELSE
            EXECUTE format(
                'CREATE POLICY %I ON %I FOR %s USING (%s)',
                policy_name, table_name, operation, using_clause
            );
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'checking',
    balance NUMERIC DEFAULT 0 NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE accounts ADD CONSTRAINT IF NOT EXISTS accounts_type_check
        CHECK (type IN ('checking', 'savings', 'cash', 'investment', 'other'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

SELECT create_policy_if_not_exists(
    'Users can manage their own accounts', 'accounts', 'ALL',
    'auth.uid() = user_id', 'auth.uid() = user_id'
);

-- ============================================================
-- 2. categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE categories ADD CONSTRAINT IF NOT EXISTS categories_type_check
        CHECK (type IN ('Saída', 'Entrada'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE categories ADD CONSTRAINT IF NOT EXISTS categories_user_name_unique
        UNIQUE (user_id, name);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

SELECT create_policy_if_not_exists(
    'Users can manage their own categories', 'categories', 'ALL',
    'auth.uid() = user_id', 'auth.uid() = user_id'
);

-- ============================================================
-- 3. credit_cards — NOVA (cartões de crédito)
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand TEXT,
    closing_day INTEGER NOT NULL,
    due_day INTEGER NOT NULL,
    limit_amount NUMERIC DEFAULT 0 NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE credit_cards ADD CONSTRAINT IF NOT EXISTS credit_cards_closing_day_check
        CHECK (closing_day BETWEEN 1 AND 31);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE credit_cards ADD CONSTRAINT IF NOT EXISTS credit_cards_due_day_check
        CHECK (due_day BETWEEN 1 AND 31);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_credit_cards_user ON credit_cards(user_id);
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

SELECT create_policy_if_not_exists(
    'Users can manage their own credit cards', 'credit_cards', 'ALL',
    'auth.uid() = user_id', 'auth.uid() = user_id'
);

-- ============================================================
-- 4. transactions — Migração de colunas novas
-- ============================================================
-- NOTA: Tabela já existe, só adicionamos colunas novas
DO $$ BEGIN
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Ajustar defaults e constraints existentes
DO $$ BEGIN
    ALTER TABLE transactions ALTER COLUMN description SET DEFAULT '';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE transactions ALTER COLUMN category SET DEFAULT '';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE transactions ALTER COLUMN payment_method SET DEFAULT '';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE transactions ALTER COLUMN bank SET DEFAULT '';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Índices (IF NOT EXISTS já é seguro)
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_credit_card ON transactions(credit_card_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

SELECT create_policy_if_not_exists(
    'Users can manage their own transactions', 'transactions', 'ALL',
    'auth.uid() = user_id', 'auth.uid() = user_id'
);

-- ============================================================
-- 5. budgets — Migração de colunas novas
-- ============================================================
DO $$ BEGIN
    ALTER TABLE budgets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE budgets ADD COLUMN IF NOT EXISTS start_date DATE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE budgets ADD COLUMN IF NOT EXISTS end_date DATE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE budgets ALTER COLUMN period SET DEFAULT 'monthly';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE budgets ADD CONSTRAINT IF NOT EXISTS budgets_period_check
        CHECK (period IN ('monthly', 'yearly', 'custom'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(user_id, category);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

SELECT create_policy_if_not_exists(
    'Users can manage their own budgets', 'budgets', 'ALL',
    'auth.uid() = user_id', 'auth.uid() = user_id'
);

-- ============================================================
-- 6. goals — Migração de colunas novas
-- ============================================================
DO $$ BEGIN
    ALTER TABLE goals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE goals ADD COLUMN IF NOT EXISTS icon TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE goals ADD COLUMN IF NOT EXISTS color TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE goals ADD CONSTRAINT IF NOT EXISTS goals_current_amount_check
        CHECK (current_amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

SELECT create_policy_if_not_exists(
    'Users can manage their own goals', 'goals', 'ALL',
    'auth.uid() = user_id', 'auth.uid() = user_id'
);

-- ============================================================
-- 7. investments — Migração de colunas novas
-- ============================================================
DO $$ BEGIN
    ALTER TABLE investments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE investments ADD COLUMN IF NOT EXISTS quantity NUMERIC;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE investments ADD COLUMN IF NOT EXISTS unit_price NUMERIC;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE investments ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE investments ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'other';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE investments ADD CONSTRAINT IF NOT EXISTS investments_type_check
        CHECK (type IN ('stock', 'fund', 'treasury', 'crypto', 'fixed_income', 'property', 'other'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE investments ADD CONSTRAINT IF NOT EXISTS investments_amount_check
        CHECK (amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_type ON investments(user_id, type);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

SELECT create_policy_if_not_exists(
    'Users can manage their own investments', 'investments', 'ALL',
    'auth.uid() = user_id', 'auth.uid() = user_id'
);

-- ============================================================
-- 8. documents
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_transaction ON documents(transaction_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

SELECT create_policy_if_not_exists(
    'Users can manage their own documents', 'documents', 'ALL',
    'auth.uid() = user_id', 'auth.uid() = user_id'
);

-- ============================================================
-- 9. ocr_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS ocr_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    raw_text TEXT,
    parsed_data JSONB,
    confidence NUMERIC,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE ocr_logs ADD CONSTRAINT IF NOT EXISTS ocr_logs_confidence_check
        CHECK (confidence >= 0 AND confidence <= 1);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE ocr_logs ADD CONSTRAINT IF NOT EXISTS ocr_logs_status_check
        CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_ocr_logs_user ON ocr_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_document ON ocr_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_status ON ocr_logs(status);

ALTER TABLE ocr_logs ENABLE ROW LEVEL SECURITY;

SELECT create_policy_if_not_exists(
    'Users can manage their own ocr_logs', 'ocr_logs', 'ALL',
    'auth.uid() = user_id', 'auth.uid() = user_id'
);

-- ============================================================
-- View: monthly_summary — Resumo mensal por usuário
-- ============================================================
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
    user_id,
    DATE_TRUNC('month', date)::DATE AS month,
    COUNT(*) FILTER (WHERE type = 'Entrada') AS entries_count,
    COUNT(*) FILTER (WHERE type = 'Saída') AS expenses_count,
    SUM(amount) FILTER (WHERE type = 'Entrada') AS total_entries,
    SUM(amount) FILTER (WHERE type = 'Saída') AS total_expenses,
    SUM(amount) FILTER (WHERE type = 'Entrada') - SUM(amount) FILTER (WHERE type = 'Saída') AS balance
FROM transactions
GROUP BY user_id, DATE_TRUNC('month', date);

-- ============================================================
-- Função: update_updated_at() — Trigger p/ updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers (DROP + CREATE para ser idempotente)
DO $$ BEGIN
    DROP TRIGGER IF EXISTS trg_accounts_updated_at ON accounts;
    CREATE TRIGGER trg_accounts_updated_at
        BEFORE UPDATE ON accounts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP TRIGGER IF EXISTS trg_credit_cards_updated_at ON credit_cards;
    CREATE TRIGGER trg_credit_cards_updated_at
        BEFORE UPDATE ON credit_cards
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
    CREATE TRIGGER trg_transactions_updated_at
        BEFORE UPDATE ON transactions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP TRIGGER IF EXISTS trg_budgets_updated_at ON budgets;
    CREATE TRIGGER trg_budgets_updated_at
        BEFORE UPDATE ON budgets
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP TRIGGER IF EXISTS trg_goals_updated_at ON goals;
    CREATE TRIGGER trg_goals_updated_at
        BEFORE UPDATE ON goals
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP TRIGGER IF EXISTS trg_investments_updated_at ON investments;
    CREATE TRIGGER trg_investments_updated_at
        BEFORE UPDATE ON investments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
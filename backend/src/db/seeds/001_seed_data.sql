-- ============================================================
-- Seed 001: Dados iniciais
-- ============================================================

-- Inserir categorias padrão para cada novo usuário (via trigger)
-- Isso é feito via trigger no auth.users, mas também podemos
-- inserir manualmente para testes.

-- Nota: Os seeds dependem do user_id, que é definido no Supabase Auth.
-- Para usar: substitua 'SEED_USER_UUID' pelo UUID real do usuário.

-- ============================================================
-- Categorias padrão (Entrada)
-- ============================================================
-- INSERT INTO categories (user_id, name, type, color, icon) VALUES
--     ('SEED_USER_UUID', 'Salário',       'Entrada', '#00d4aa', 'wallet'),
--     ('SEED_USER_UUID', 'Freelance',     'Entrada', '#60a5fa', 'briefcase'),
--     ('SEED_USER_UUID', 'Investimentos', 'Entrada', '#a78bfa', 'trending-up'),
--     ('SEED_USER_UUID', 'Outras Receitas','Entrada', '#fbbf24', 'plus-circle');

-- ============================================================
-- Categorias padrão (Saída)
-- ============================================================
-- INSERT INTO categories (user_id, name, type, color, icon) VALUES
--     ('SEED_USER_UUID', 'Alimentação',    'Saída', '#ff4d6d', 'shopping-cart'),
--     ('SEED_USER_UUID', 'Transporte',     'Saída', '#fb923c', 'car'),
--     ('SEED_USER_UUID', 'Moradia',        'Saída', '#34d399', 'home'),
--     ('SEED_USER_UUID', 'Saúde',          'Saída', '#f472b6', 'heart'),
--     ('SEED_USER_UUID', 'Educação',       'Saída', '#818cf8', 'book-open'),
--     ('SEED_USER_UUID', 'Lazer',          'Saída', '#fbbf24', 'film'),
--     ('SEED_USER_UUID', 'Assinaturas',    'Saída', '#22d3ee', 'repeat'),
--     ('SEED_USER_UUID', 'Compras',        'Saída', '#e879f9', 'shopping-bag'),
--     ('SEED_USER_UUID', 'Serviços',       'Saída', '#94a3b8', 'settings'),
--     ('SEED_USER_UUID', 'Outros Gastos',  'Saída', '#64748b', 'more-horizontal');

-- ============================================================
-- Função: Auto-criar categorias ao registrar usuário
-- ============================================================
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- Categorias de Entrada
    INSERT INTO categories (user_id, name, type, color, icon) VALUES
        (NEW.id, 'Salário',       'Entrada', '#00d4aa', 'wallet'),
        (NEW.id, 'Freelance',     'Entrada', '#60a5fa', 'briefcase'),
        (NEW.id, 'Investimentos', 'Entrada', '#a78bfa', 'trending-up'),
        (NEW.id, 'Outras Receitas','Entrada', '#fbbf24', 'plus-circle');

    -- Categorias de Saída
    INSERT INTO categories (user_id, name, type, color, icon) VALUES
        (NEW.id, 'Alimentação',    'Saída', '#ff4d6d', 'shopping-cart'),
        (NEW.id, 'Transporte',     'Saída', '#fb923c', 'car'),
        (NEW.id, 'Moradia',        'Saída', '#34d399', 'home'),
        (NEW.id, 'Saúde',          'Saída', '#f472b6', 'heart'),
        (NEW.id, 'Educação',       'Saída', '#818cf8', 'book-open'),
        (NEW.id, 'Lazer',          'Saída', '#fbbf24', 'film'),
        (NEW.id, 'Assinaturas',    'Saída', '#22d3ee', 'repeat'),
        (NEW.id, 'Compras',        'Saída', '#e879f9', 'shopping-bag'),
        (NEW.id, 'Serviços',       'Saída', '#94a3b8', 'settings'),
        (NEW.id, 'Outros Gastos',  'Saída', '#64748b', 'more-horizontal');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: automaticamente cria categorias ao registrar usuário
DROP TRIGGER IF EXISTS trg_create_default_categories ON auth.users;

CREATE TRIGGER trg_create_default_categories
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_categories();
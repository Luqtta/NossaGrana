-- Criar um casal padrão (ID 1)
INSERT INTO casais (id, nome_casal, percentual_divisao, data_criacao) 
VALUES (1, 'Casal Padrão', 50, NOW())
ON CONFLICT DO NOTHING;

-- Categorias padrão para o casal 1
INSERT INTO categorias (nome, icone, cor, ativa, casal_id, orcamento_mensal) VALUES
('Alimentação', '🍔', '#10b981', true, 1, 100),
('Transporte', '🚗', '#3b82f6', true, 1, 100),
('Moradia', '🏠', '#8b5cf6', true, 1, 100),
('Saúde', '💊', '#ef4444', true, 1, 100),
('Lazer', '🎮', '#f59e0b', true, 1, 100),
('Educação', '📚', '#06b6d4', true, 1, 100),
('Vestuário', '👔', '#ec4899', true, 1, 100),
('Serviços', '🔧', '#6366f1', true, 1, 100),
('Impostos', '💰', '#14b8a6', true, 1, 100),
('Outros', '📦', '#64748b', true, 1, 100)
ON CONFLICT DO NOTHING;

-- Garantir or??amento padr??o para categorias existentes sem or??amento
UPDATE categorias
SET orcamento_mensal = 100
WHERE orcamento_mensal IS NULL OR orcamento_mensal = 0;

-- Criar um casal padrão (ID 1)
INSERT INTO casais (id, nome_casal, percentual_divisao, data_criacao) 
VALUES (1, 'Casal Padrão', 50, NOW())
ON CONFLICT DO NOTHING;

-- Categorias padrão para o casal 1
INSERT INTO categorias (nome, icone, cor, ativa, casal_id) VALUES
('Alimentação', '🍔', '#10b981', true, 1),
('Transporte', '🚗', '#3b82f6', true, 1),
('Moradia', '🏠', '#8b5cf6', true, 1),
('Saúde', '💊', '#ef4444', true, 1),
('Lazer', '🎮', '#f59e0b', true, 1),
('Educação', '📚', '#06b6d4', true, 1),
('Vestuário', '👔', '#ec4899', true, 1),
('Serviços', '🔧', '#6366f1', true, 1),
('Impostos', '💰', '#14b8a6', true, 1),
('Outros', '📦', '#64748b', true, 1)
ON CONFLICT DO NOTHING;
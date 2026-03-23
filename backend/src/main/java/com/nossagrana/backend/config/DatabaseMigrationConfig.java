package com.nossagrana.backend.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Aplica correções de schema que o ddl-auto:update não cobre.
 * Cada migração é idempotente (segura para rodar múltiplas vezes).
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class DatabaseMigrationConfig {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void aplicarMigracoes() {
        corrigirConstraintTipoCodigoVerificacao();
    }

    /**
     * O constraint original foi criado sem o valor TROCA_SENHA.
     * Dropa o constraint antigo e recria com todos os valores válidos.
     */
    private void corrigirConstraintTipoCodigoVerificacao() {
        try {
            jdbcTemplate.execute(
                "ALTER TABLE codigos_verificacao DROP CONSTRAINT IF EXISTS codigos_verificacao_tipo_check"
            );
            jdbcTemplate.execute(
                "ALTER TABLE codigos_verificacao ADD CONSTRAINT codigos_verificacao_tipo_check " +
                "CHECK (tipo IN ('VERIFICACAO_EMAIL', 'RESET_SENHA', 'TROCA_EMAIL', 'TROCA_SENHA'))"
            );
            log.info("Migration: constraint codigos_verificacao_tipo_check atualizado com sucesso.");
        } catch (Exception e) {
            log.warn("Migration: falha ao atualizar constraint tipo — {}", e.getMessage());
        }
    }
}

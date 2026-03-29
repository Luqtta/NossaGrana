package com.nossagrana.backend.scheduler;

import com.nossagrana.backend.service.DespesaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecorrenciaScheduler {

    private final DespesaService despesaService;

    /**
     * Executa todo dia 1 de cada mês à meia-noite (UTC).
     * Gera automaticamente as instâncias das despesas fixas recorrentes.
     */
    @Scheduled(cron = "0 0 1 1 * ?")
    public void gerarDespesasRecorrentes() {
        log.info("Iniciando geracao de despesas recorrentes mensais...");
        try {
            despesaService.gerarInstanciasMensais();
            log.info("Geracao de despesas recorrentes concluida com sucesso.");
        } catch (Exception e) {
            log.error("Erro ao gerar despesas recorrentes: {}", e.getMessage(), e);
        }
    }
}

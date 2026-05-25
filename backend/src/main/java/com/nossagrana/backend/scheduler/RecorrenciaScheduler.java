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
     * Executa diariamente à 01:00 (UTC).
     * Gera instâncias das despesas fixas recorrentes no mesmo dia do mês da despesa origem.
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void gerarDespesasRecorrentes() {
        log.info("Iniciando verificacao diaria de despesas recorrentes...");
        try {
            despesaService.gerarInstanciasMensais();
            log.info("Geracao de despesas recorrentes concluida com sucesso.");
        } catch (Exception e) {
            log.error("Erro ao gerar despesas recorrentes: {}", e.getMessage(), e);
        }
    }
}

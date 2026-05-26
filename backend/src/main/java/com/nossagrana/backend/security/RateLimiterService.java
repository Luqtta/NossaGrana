package com.nossagrana.backend.security;

import com.nossagrana.backend.entity.RateLimitEntry;
import com.nossagrana.backend.exception.BusinessException;
import com.nossagrana.backend.repository.RateLimitEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Rate limiter persistente em tabela. Sobrevive a restart do app e funciona
 * em multiplas instancias compartilhando o mesmo banco. Janela deslizante
 * por chave (email ou IP).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimiterService {

    private final RateLimitEntryRepository repository;

    @Transactional
    public void verificar(String chave, int maxTentativas, long janelaMilis) {
        long agora = Instant.now().toEpochMilli();
        long desde = agora - janelaMilis;

        long usadas = repository.contar(chave, desde);
        if (usadas >= maxTentativas) {
            throw new BusinessException("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
        }

        repository.save(RateLimitEntry.builder().chave(chave).timestampMs(agora).build());
    }

    @Transactional
    public void limpar(String chave) {
        repository.limparPorChave(chave);
    }

    /**
     * Limpeza automatica: a cada hora remove entradas com mais de 24h.
     * Mantem a tabela enxuta sem precisar de cron externo.
     */
    @Scheduled(fixedDelay = 3_600_000L, initialDelay = 60_000L)
    @Transactional
    public void limparAntigos() {
        long limite = Instant.now().toEpochMilli() - 86_400_000L; // 24h
        int removidos = repository.limparAntigos(limite);
        if (removidos > 0) {
            log.info("Rate limiter: removeu {} entradas antigas", removidos);
        }
    }
}

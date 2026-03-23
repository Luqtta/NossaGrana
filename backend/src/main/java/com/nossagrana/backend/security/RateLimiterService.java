package com.nossagrana.backend.security;

import com.nossagrana.backend.exception.BusinessException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiter em memória para endpoints sensíveis.
 * Usa janela deslizante por chave (email ou IP).
 */
@Component
public class RateLimiterService {

    // chave -> timestamps das últimas tentativas (epoch millis)
    private final Map<String, Deque<Long>> registros = new ConcurrentHashMap<>();

    /**
     * Verifica e registra uma tentativa. Lança exceção se o limite for excedido.
     *
     * @param chave         identificador (ex: "login:email@x.com" ou "reset:email@x.com")
     * @param maxTentativas número máximo de tentativas na janela
     * @param janelaMilis   tamanho da janela em milissegundos
     */
    public void verificar(String chave, int maxTentativas, long janelaMilis) {
        long agora = Instant.now().toEpochMilli();
        long limite = agora - janelaMilis;

        Deque<Long> timestamps = registros.computeIfAbsent(chave, k -> new ArrayDeque<>());

        synchronized (timestamps) {
            // remove entradas fora da janela
            while (!timestamps.isEmpty() && timestamps.peekFirst() < limite) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= maxTentativas) {
                throw new BusinessException("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
            }

            timestamps.addLast(agora);
        }
    }

    /** Limpa o registro de uma chave (ex: após login bem-sucedido). */
    public void limpar(String chave) {
        registros.remove(chave);
    }
}

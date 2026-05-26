package com.nossagrana.backend.service;

import com.nossagrana.backend.entity.AuditLog;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Registra eventos sensiveis para investigacao/suporte. Nao bloqueia o fluxo se falhar.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    public static final String LOGIN_SUCESSO = "LOGIN_SUCESSO";
    public static final String LOGIN_FALHA = "LOGIN_FALHA";
    public static final String LOGOUT = "LOGOUT";
    public static final String REGISTRO = "REGISTRO";
    public static final String EMAIL_VERIFICADO = "EMAIL_VERIFICADO";
    public static final String TROCA_SENHA = "TROCA_SENHA";
    public static final String RESET_SENHA = "RESET_SENHA";
    public static final String TROCA_EMAIL = "TROCA_EMAIL";
    public static final String CONVITE_ENVIADO = "CONVITE_ENVIADO";
    public static final String CONVITE_ACEITO = "CONVITE_ACEITO";
    public static final String PARCEIRO_REMOVIDO = "PARCEIRO_REMOVIDO";
    public static final String RATE_LIMIT_BLOQUEADO = "RATE_LIMIT_BLOQUEADO";

    private final AuditLogRepository repo;

    public void registrar(String evento, Usuario usuario, String detalhes) {
        try {
            HttpServletRequest req = getCurrentRequest();
            AuditLog entry = AuditLog.builder()
                .evento(evento)
                .usuarioId(usuario != null ? usuario.getId() : null)
                .casalId(usuario != null && usuario.getCasal() != null ? usuario.getCasal().getId() : null)
                .ip(req != null ? extractIp(req) : null)
                .userAgent(req != null ? truncate(req.getHeader("User-Agent"), 255) : null)
                .detalhes(truncate(detalhes, 4000))
                .build();
            repo.save(entry);
        } catch (Exception e) {
            // nunca quebra fluxo de auth/negocio por causa de logging
            log.warn("Falha ao registrar audit log {}: {}", evento, e.getMessage());
        }
    }

    public void registrarSemUsuario(String evento, String detalhes) {
        registrar(evento, null, detalhes);
    }

    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attrs != null ? attrs.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String extractIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // primeiro IP da lista
            int idx = xff.indexOf(',');
            return truncate(idx > 0 ? xff.substring(0, idx).trim() : xff.trim(), 64);
        }
        return truncate(req.getRemoteAddr(), 64);
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}

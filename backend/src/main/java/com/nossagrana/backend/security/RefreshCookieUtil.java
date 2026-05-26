package com.nossagrana.backend.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Encapsula leitura e escrita do cookie HttpOnly que carrega o refresh token.
 * - HttpOnly: nao acessivel por JS (protege contra XSS)
 * - Secure: so trafega em HTTPS (em prod)
 * - SameSite=None com Secure pois o frontend (Vercel) e o backend (Railway) estao
 *   em dominios diferentes; o navegador exige SameSite=None+Secure para enviar
 *   credentials em requests cross-site
 * - Path=/api/auth: cookie so vai nas rotas de auth (refresh, logout)
 */
@Component
public class RefreshCookieUtil {

    public static final String COOKIE_NAME = "ng_refresh";

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpirationMs;

    @Value("${app.cookie-secure:true}")
    private boolean secure;

    public void escrever(HttpServletResponse response, String refreshToken) {
        StringBuilder sb = new StringBuilder();
        sb.append(COOKIE_NAME).append("=").append(refreshToken);
        sb.append("; Path=/api/auth");
        sb.append("; HttpOnly");
        sb.append("; Max-Age=").append(refreshExpirationMs / 1000);
        if (secure) {
            sb.append("; Secure");
            sb.append("; SameSite=None");
        } else {
            sb.append("; SameSite=Lax");
        }
        response.addHeader("Set-Cookie", sb.toString());
    }

    public void limpar(HttpServletResponse response) {
        StringBuilder sb = new StringBuilder();
        sb.append(COOKIE_NAME).append("=");
        sb.append("; Path=/api/auth");
        sb.append("; HttpOnly");
        sb.append("; Max-Age=0");
        if (secure) {
            sb.append("; Secure");
            sb.append("; SameSite=None");
        } else {
            sb.append("; SameSite=Lax");
        }
        response.addHeader("Set-Cookie", sb.toString());
    }

    public String ler(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if (COOKIE_NAME.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}

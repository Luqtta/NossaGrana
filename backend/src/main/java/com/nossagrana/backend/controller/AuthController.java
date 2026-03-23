package com.nossagrana.backend.controller;

import com.nossagrana.backend.dto.*;
import com.nossagrana.backend.security.RateLimiterService;
import com.nossagrana.backend.service.AuthService;
import com.nossagrana.backend.service.VerificacaoService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final VerificacaoService verificacaoService;
    private final RateLimiterService rateLimiter;

    // 5 tentativas por minuto por e-mail
    private static final int LOGIN_MAX = 5;
    private static final long LOGIN_JANELA = 60_000L;

    // 3 solicitações por hora por e-mail
    private static final int RESET_MAX = 3;
    private static final long RESET_JANELA = 3_600_000L;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletRequest httpRequest) {
        rateLimiter.verificar("login:" + request.getEmail().toLowerCase(), LOGIN_MAX, LOGIN_JANELA);
        AuthResponse response = authService.login(request);
        rateLimiter.limpar("login:" + request.getEmail().toLowerCase());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request.getRefreshToken()));
    }

    @PostMapping("/verificar-email")
    public ResponseEntity<AuthResponse> verificarEmail(@Valid @RequestBody VerificarEmailRequest request) {
        return ResponseEntity.ok(verificacaoService.verificarEmail(request.getUsuarioId(), request.getCodigo()));
    }

    @PostMapping("/reenviar-verificacao")
    public ResponseEntity<Void> reenviarVerificacao(@Valid @RequestBody ReenviarCodigoRequest request) {
        rateLimiter.verificar("reenvio:" + request.getEmail().toLowerCase(), RESET_MAX, RESET_JANELA);
        verificacaoService.reenviarCodigoVerificacao(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/solicitar-reset-senha")
    public ResponseEntity<Void> solicitarResetSenha(@Valid @RequestBody SolicitarResetSenhaRequest request) {
        rateLimiter.verificar("reset:" + request.getEmail().toLowerCase(), RESET_MAX, RESET_JANELA);
        verificacaoService.gerarEEnviarCodigoReset(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-senha")
    public ResponseEntity<Void> resetarSenha(@Valid @RequestBody ResetSenhaRequest request) {
        verificacaoService.resetarSenha(request.getEmail(), request.getCodigo(), request.getNovaSenha());
        return ResponseEntity.ok().build();
    }
}

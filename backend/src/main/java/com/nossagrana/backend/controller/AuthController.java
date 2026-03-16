package com.nossagrana.backend.controller;

import com.nossagrana.backend.dto.*;
import com.nossagrana.backend.service.AuthService;
import com.nossagrana.backend.service.VerificacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final VerificacaoService verificacaoService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
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
        verificacaoService.reenviarCodigoVerificacao(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/solicitar-reset-senha")
    public ResponseEntity<Void> solicitarResetSenha(@Valid @RequestBody SolicitarResetSenhaRequest request) {
        verificacaoService.gerarEEnviarCodigoReset(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-senha")
    public ResponseEntity<Void> resetarSenha(@Valid @RequestBody ResetSenhaRequest request) {
        verificacaoService.resetarSenha(request.getEmail(), request.getCodigo(), request.getNovaSenha());
        return ResponseEntity.ok().build();
    }
}

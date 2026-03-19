package com.nossagrana.backend.controller;

import com.nossagrana.backend.dto.AtualizarFotoRequest;
import com.nossagrana.backend.dto.AtualizarNomeRequest;
import com.nossagrana.backend.dto.AuthResponse;
import com.nossagrana.backend.dto.ConfirmarTrocaEmailRequest;
import com.nossagrana.backend.dto.ConfirmarTrocaSenhaRequest;
import com.nossagrana.backend.dto.SolicitarTrocaEmailRequest;
import com.nossagrana.backend.dto.UsuarioResponse;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.security.AutenticacaoHelper;
import com.nossagrana.backend.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final AutenticacaoHelper autenticacaoHelper;
    private final UsuarioService usuarioService;

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> buscarMeuUsuario() {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        return ResponseEntity.ok(usuarioService.mapUsuario(usuario));
    }

    @PutMapping("/me/nome")
    public ResponseEntity<UsuarioResponse> atualizarNome(@Valid @RequestBody AtualizarNomeRequest request) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        return ResponseEntity.ok(usuarioService.atualizarNome(usuario, request.getNome()));
    }

    @PutMapping("/me/foto")
    public ResponseEntity<UsuarioResponse> atualizarFoto(@RequestBody AtualizarFotoRequest request) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        return ResponseEntity.ok(usuarioService.atualizarFoto(usuario, request.getFotoPerfil()));
    }

    @PostMapping("/me/email/solicitar")
    public ResponseEntity<Void> solicitarTrocaEmail(@Valid @RequestBody SolicitarTrocaEmailRequest request) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        usuarioService.solicitarTrocaEmail(usuario, request.getNovoEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/me/email/confirmar")
    public ResponseEntity<AuthResponse> confirmarTrocaEmail(@Valid @RequestBody ConfirmarTrocaEmailRequest request) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        return ResponseEntity.ok(usuarioService.confirmarTrocaEmail(usuario, request.getCodigo()));
    }

    @PostMapping("/me/senha/solicitar")
    public ResponseEntity<Void> solicitarTrocaSenha() {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        usuarioService.solicitarTrocaSenha(usuario);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/me/senha/confirmar")
    public ResponseEntity<Void> confirmarTrocaSenha(@Valid @RequestBody ConfirmarTrocaSenhaRequest request) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        usuarioService.confirmarTrocaSenha(usuario, request.getCodigo(), request.getNovaSenha());
        return ResponseEntity.ok().build();
    }
}

package com.nossagrana.backend.controller;

import com.nossagrana.backend.dto.AuthResponse;
import com.nossagrana.backend.dto.ConviteInfoResponse;
import com.nossagrana.backend.dto.ConviteRequest;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.security.AutenticacaoHelper;
import com.nossagrana.backend.service.ConviteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/convites")
@RequiredArgsConstructor
public class ConviteController {

    private final ConviteService conviteService;
    private final AutenticacaoHelper autenticacaoHelper;

    @PostMapping
    public ResponseEntity<Void> criarConvite(@Valid @RequestBody ConviteRequest request) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        conviteService.criarConvite(usuario.getCasal().getId(), request.getEmail(), usuario.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{codigo}")
    public ResponseEntity<ConviteInfoResponse> buscarConvite(@PathVariable String codigo) {
        return ResponseEntity.ok(conviteService.buscarConvite(codigo));
    }

    @PostMapping("/{codigo}/aceitar")
    public ResponseEntity<AuthResponse> aceitarConvite(@PathVariable String codigo) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        return ResponseEntity.ok(conviteService.aceitarConvite(codigo, usuario.getId()));
    }
}

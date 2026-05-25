package com.nossagrana.backend.controller;

import com.nossagrana.backend.dto.PreferenciasDashboardRequest;
import com.nossagrana.backend.dto.PreferenciasDashboardResponse;
import com.nossagrana.backend.entity.PreferenciasDashboard;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.security.AutenticacaoHelper;
import com.nossagrana.backend.service.PreferenciasDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/preferencias-dashboard")
@RequiredArgsConstructor
public class PreferenciasDashboardController {

    private final PreferenciasDashboardService service;
    private final AutenticacaoHelper autenticacaoHelper;

    @GetMapping
    public ResponseEntity<PreferenciasDashboardResponse> buscar() {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        return ResponseEntity.ok(service.buscar(usuario.getId()));
    }

    @PutMapping
    public ResponseEntity<PreferenciasDashboardResponse> atualizar(@RequestBody PreferenciasDashboardRequest request) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        return ResponseEntity.ok(service.atualizar(usuario.getId(), request));
    }

    @GetMapping("/imagem-fundo")
    public ResponseEntity<byte[]> imagemFundo() {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        PreferenciasDashboard pref = service.buscarEntidade(usuario.getId());
        if (pref == null || pref.getImagemFundo() == null || pref.getImagemFundo().length == 0) {
            return ResponseEntity.notFound().build();
        }
        String mime = pref.getImagemFundoMime() != null ? pref.getImagemFundoMime() : "image/jpeg";
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(mime))
            .header(HttpHeaders.CACHE_CONTROL, "private, max-age=60")
            .body(pref.getImagemFundo());
    }
}

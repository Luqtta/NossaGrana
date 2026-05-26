package com.nossagrana.backend.controller;

import com.nossagrana.backend.dto.ComprovanteRequest;
import com.nossagrana.backend.dto.ComprovanteResponse;
import com.nossagrana.backend.entity.Comprovante;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.security.AutenticacaoHelper;
import com.nossagrana.backend.service.ComprovanteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comprovantes")
@RequiredArgsConstructor
public class ComprovanteController {

    private final ComprovanteService comprovanteService;
    private final AutenticacaoHelper autenticacaoHelper;

    @PostMapping
    public ResponseEntity<ComprovanteResponse> upload(@Valid @RequestBody ComprovanteRequest request) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(comprovanteService.upload(request, usuario.getId()));
    }

    @GetMapping("/casal/{casalId}")
    public ResponseEntity<List<ComprovanteResponse>> listar(@PathVariable Long casalId) {
        autenticacaoHelper.validarAcessoCasal(casalId);
        return ResponseEntity.ok(comprovanteService.listarPorCasal(casalId));
    }

    @GetMapping("/casal/{casalId}/mes/{mes}/ano/{ano}")
    public ResponseEntity<List<ComprovanteResponse>> listarPorMes(
            @PathVariable Long casalId,
            @PathVariable int mes,
            @PathVariable int ano) {
        autenticacaoHelper.validarAcessoCasal(casalId);
        return ResponseEntity.ok(comprovanteService.listarPorMes(casalId, mes, ano));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        Comprovante c = comprovanteService.baixar(id, usuario.getId());

        // Imagens podem ser inline (preview no app); PDFs forcam download para evitar
        // execucao de scripts via PDF.js de extensoes.
        String mime = c.getMimeType();
        boolean isImagem = mime != null && mime.startsWith("image/");
        String disposicao = isImagem ? "inline" : "attachment";
        String filename = c.getNome().replace("\"", "");

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(mime))
            .header(HttpHeaders.CONTENT_DISPOSITION, disposicao + "; filename=\"" + filename + "\"")
            .header("X-Content-Type-Options", "nosniff")
            .body(c.getDados());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        comprovanteService.deletar(id, usuario.getId());
        return ResponseEntity.noContent().build();
    }
}

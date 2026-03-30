package com.nossagrana.backend.controller;

import com.nossagrana.backend.dto.AcertoMensalResponse;
import com.nossagrana.backend.dto.CompensacaoRequest;
import com.nossagrana.backend.dto.CompensacaoResponse;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.security.AutenticacaoHelper;
import com.nossagrana.backend.service.CompensacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/compensacoes")
@RequiredArgsConstructor
public class CompensacaoController {

    private final CompensacaoService compensacaoService;
    private final AutenticacaoHelper autenticacaoHelper;

    @PostMapping
    public ResponseEntity<CompensacaoResponse> criar(@Valid @RequestBody CompensacaoRequest request) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(compensacaoService.criar(request, usuario.getId()));
    }

    @GetMapping("/casal/{casalId}/mes/{mes}/ano/{ano}")
    public ResponseEntity<List<CompensacaoResponse>> listarPorMes(
            @PathVariable Long casalId,
            @PathVariable int mes,
            @PathVariable int ano) {
        autenticacaoHelper.validarAcessoCasal(casalId);
        return ResponseEntity.ok(compensacaoService.listarPorMes(casalId, mes, ano));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompensacaoResponse> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody CompensacaoRequest request) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        return ResponseEntity.ok(compensacaoService.atualizar(id, request, usuario.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> inativar(@PathVariable Long id) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        compensacaoService.inativar(id, usuario.getId());
        return ResponseEntity.ok("Compensação removida com sucesso!");
    }

    @GetMapping("/casal/{casalId}/acerto")
    public ResponseEntity<AcertoMensalResponse> calcularAcerto(
            @PathVariable Long casalId,
            @RequestParam int mes,
            @RequestParam int ano) {
        autenticacaoHelper.validarAcessoCasal(casalId);
        return ResponseEntity.ok(compensacaoService.calcularAcerto(casalId, mes, ano));
    }
}

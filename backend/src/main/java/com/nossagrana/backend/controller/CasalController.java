package com.nossagrana.backend.controller;

import com.nossagrana.backend.entity.Casal;
import com.nossagrana.backend.security.AutenticacaoHelper;
import com.nossagrana.backend.service.CasalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/casal")
@RequiredArgsConstructor
public class CasalController {

    private final CasalService casalService;
    private final AutenticacaoHelper autenticacaoHelper;

    @GetMapping("/{casalId}")
    public ResponseEntity<Casal> buscarCasal(@PathVariable Long casalId) {
        autenticacaoHelper.validarAcessoCasal(casalId);
        return ResponseEntity.ok(casalService.buscarPorId(casalId));
    }

    @DeleteMapping("/{casalId}/remover-parceiro")
    public ResponseEntity<String> removerParceiro(@PathVariable Long casalId) {
        autenticacaoHelper.validarAcessoCasal(casalId);
        casalService.removerParceiro(casalId);
        return ResponseEntity.ok("Parceiro removido com sucesso!");
    }

    @PutMapping("/{casalId}/atualizar-nomes")
    public ResponseEntity<String> atualizarNomes(
            @PathVariable Long casalId,
            @RequestBody Map<String, String> request) {
        autenticacaoHelper.validarAcessoCasal(casalId);
        casalService.atualizarNomes(casalId, request.get("nomeParceiro1"), request.get("nomeParceiro2"));
        return ResponseEntity.ok("Nomes atualizados com sucesso!");
    }

    @PutMapping("/{casalId}/meta")
    public ResponseEntity<String> definirMeta(
            @PathVariable Long casalId,
            @RequestBody Map<String, BigDecimal> request) {
        autenticacaoHelper.validarAcessoCasal(casalId);
        casalService.definirMeta(casalId, request.get("metaMensal"));
        return ResponseEntity.ok("Meta definida com sucesso!");
    }

    @GetMapping("/{casalId}/membros")
    public ResponseEntity<List<Map<String, Object>>> buscarMembros(@PathVariable Long casalId) {
        autenticacaoHelper.validarAcessoCasal(casalId);
        return ResponseEntity.ok(casalService.buscarMembros(casalId));
    }

    @GetMapping("/{casalId}/estatisticas")
    public ResponseEntity<Map<String, Object>> buscarEstatisticas(
            @PathVariable Long casalId,
            @RequestParam int mes,
            @RequestParam int ano) {
        autenticacaoHelper.validarAcessoCasal(casalId);
        return ResponseEntity.ok(casalService.buscarEstatisticas(casalId, mes, ano));
    }
}

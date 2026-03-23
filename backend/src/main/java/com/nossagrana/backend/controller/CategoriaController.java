package com.nossagrana.backend.controller;

import com.nossagrana.backend.dto.CategoriaResponse;
import com.nossagrana.backend.dto.SaldoCategoriaResponse;
import com.nossagrana.backend.entity.Categoria;
import com.nossagrana.backend.security.AutenticacaoHelper;
import com.nossagrana.backend.service.CategoriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CategoriaService categoriaService;
    private final AutenticacaoHelper autenticacaoHelper;

    @GetMapping("/casal/{casalId}")
    public ResponseEntity<List<CategoriaResponse>> listarPorCasal(@PathVariable Long casalId) {
        autenticacaoHelper.validarAcessoCasal(casalId);
        List<CategoriaResponse> categorias = categoriaService.listarPorCasal(casalId);
        return ResponseEntity.ok(categorias);
    }

    @PutMapping("/{categoriaId}/orcamento")
    public ResponseEntity<String> definirOrcamento(
            @PathVariable Long categoriaId,
            @RequestBody Map<String, Double> request
    ) {
        Double orcamento = request.get("orcamento");
        categoriaService.definirOrcamento(categoriaId, orcamento, autenticacaoHelper.getUsuarioAtual());
        return ResponseEntity.ok("Orçamento definido com sucesso!");
    }

    @GetMapping("/{categoriaId}/saldo")
    public ResponseEntity<SaldoCategoriaResponse> buscarSaldo(
            @PathVariable Long categoriaId,
            @RequestParam int mes,
            @RequestParam int ano
    ) {
        return ResponseEntity.ok(categoriaService.buscarSaldoCategoria(categoriaId, mes, ano, autenticacaoHelper.getUsuarioAtual()));
    }

    @PostMapping
    public ResponseEntity<Categoria> criar(@RequestBody Map<String, Object> request) {
        String nome = (String) request.get("nome");
        String icone = (String) request.get("icone");
        String cor = (String) request.get("cor");
        Double orcamento = ((Number) request.get("orcamento")).doubleValue();
        Long casalId = ((Number) request.get("casalId")).longValue();
        autenticacaoHelper.validarAcessoCasal(casalId);
        return ResponseEntity.ok(categoriaService.criar(nome, icone, cor, orcamento, casalId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> editar(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        categoriaService.editar(id, request.get("nome"), request.get("icone"), request.get("cor"), autenticacaoHelper.getUsuarioAtual());
        return ResponseEntity.ok("Categoria atualizada!");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> desativar(@PathVariable Long id) {
        categoriaService.desativar(id, autenticacaoHelper.getUsuarioAtual());
        return ResponseEntity.ok("Categoria desativada!");
    }
}

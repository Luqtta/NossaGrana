package com.nossagrana.backend.controller;

import com.nossagrana.backend.dto.CategoriaCriarRequest;
import com.nossagrana.backend.dto.CategoriaEditarRequest;
import com.nossagrana.backend.dto.CategoriaResponse;
import com.nossagrana.backend.dto.OrcamentoRequest;
import com.nossagrana.backend.dto.SaldoCategoriaResponse;
import com.nossagrana.backend.entity.Categoria;
import com.nossagrana.backend.security.AutenticacaoHelper;
import com.nossagrana.backend.service.CategoriaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
            @Valid @RequestBody OrcamentoRequest request
    ) {
        categoriaService.definirOrcamento(categoriaId, request.getOrcamento(), autenticacaoHelper.getUsuarioAtual());
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
    public ResponseEntity<Categoria> criar(@Valid @RequestBody CategoriaCriarRequest request) {
        autenticacaoHelper.validarAcessoCasal(request.getCasalId());
        return ResponseEntity.ok(categoriaService.criar(
            request.getNome(),
            request.getIcone(),
            request.getCor(),
            request.getOrcamento(),
            request.getCasalId()
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> editar(
            @PathVariable Long id,
            @Valid @RequestBody CategoriaEditarRequest request
    ) {
        categoriaService.editar(id, request.getNome(), request.getIcone(), request.getCor(), autenticacaoHelper.getUsuarioAtual());
        return ResponseEntity.ok("Categoria atualizada!");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> desativar(@PathVariable Long id) {
        categoriaService.desativar(id, autenticacaoHelper.getUsuarioAtual());
        return ResponseEntity.ok("Categoria desativada!");
    }
}

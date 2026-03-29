package com.nossagrana.backend.controller;

import com.nossagrana.backend.dto.DespesaRequest;
import com.nossagrana.backend.dto.DespesaResponse;
import com.nossagrana.backend.entity.HistoricoEdicao;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.security.AutenticacaoHelper;
import com.nossagrana.backend.service.DespesaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/despesas")
@RequiredArgsConstructor
public class DespesaController {

    private final DespesaService despesaService;
    private final AutenticacaoHelper autenticacaoHelper;

    @PostMapping
    public ResponseEntity<DespesaResponse> criarDespesa(@Valid @RequestBody DespesaRequest request) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        return ResponseEntity.status(HttpStatus.CREATED).body(despesaService.criarDespesa(request, usuario.getId()));
    }

    @GetMapping("/casal/{casalId}/mes/{mes}/ano/{ano}")
    public ResponseEntity<List<DespesaResponse>> listarDespesasMes(
            @PathVariable Long casalId,
            @PathVariable int mes,
            @PathVariable int ano) {
        autenticacaoHelper.validarAcessoCasal(casalId);
        return ResponseEntity.ok(despesaService.listarDespesasMes(casalId, mes, ano));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DespesaResponse> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody DespesaRequest request) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        return ResponseEntity.ok(despesaService.atualizar(id, request, usuario.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletar(@PathVariable Long id) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        despesaService.deletarDespesa(id, usuario.getId());
        return ResponseEntity.ok("Despesa deletada com sucesso!");
    }

    @PatchMapping("/{id}/cancelar-recorrencia")
    public ResponseEntity<DespesaResponse> cancelarRecorrencia(@PathVariable Long id) {
        Usuario usuario = autenticacaoHelper.getUsuarioAtual();
        return ResponseEntity.ok(despesaService.cancelarRecorrencia(id, usuario.getId()));
    }

    @GetMapping("/{id}/historico")
    public ResponseEntity<List<HistoricoEdicao>> buscarHistorico(@PathVariable Long id) {
        autenticacaoHelper.getUsuarioAtual(); // garante autenticação
        return ResponseEntity.ok(despesaService.buscarHistorico(id));
    }

    @GetMapping("/filtrar")
    public ResponseEntity<List<DespesaResponse>> filtrar(
            @RequestParam Long casalId,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) String responsavel,
            @RequestParam(required = false) String tipoDespesa,
            @RequestParam(required = false) String descricao,
            @RequestParam String dataInicio,
            @RequestParam String dataFim) {
        autenticacaoHelper.validarAcessoCasal(casalId);
        LocalDate inicio = LocalDate.parse(dataInicio);
        LocalDate fim = LocalDate.parse(dataFim);
        return ResponseEntity.ok(despesaService.filtrar(casalId, categoriaId, responsavel, tipoDespesa, descricao, inicio, fim));
    }
}

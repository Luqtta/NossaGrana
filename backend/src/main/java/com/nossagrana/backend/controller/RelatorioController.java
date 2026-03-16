package com.nossagrana.backend.controller;

import com.nossagrana.backend.service.RelatorioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

import java.util.Map;

@RestController
@RequestMapping("/api/relatorios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RelatorioController {

    private final RelatorioService relatorioService;

    @GetMapping("/gastos-por-categoria")
    public ResponseEntity<Map<String, Object>> gastosPorCategoria(
            @RequestParam Long casalId,
            @RequestParam int mes,
            @RequestParam int ano
    ) {
        return ResponseEntity.ok(relatorioService.gastosPorCategoria(casalId, mes, ano));
    }

    @GetMapping("/evolucao-mensal")
    public ResponseEntity<Map<String, Object>> evolucaoMensal(
            @RequestParam Long casalId,
            @RequestParam int ano
    ) {
        return ResponseEntity.ok(relatorioService.evolucaoMensal(casalId, ano));
    }

    @GetMapping("/comparacao-parceiros")
    public ResponseEntity<Map<String, Object>> comparacaoParceiros(
            @RequestParam Long casalId,
            @RequestParam int mes,
            @RequestParam int ano
    ) {
        return ResponseEntity.ok(relatorioService.comparacaoParceiros(casalId, mes, ano));
    }

    @GetMapping("/gastos-por-categoria/periodo")
    public ResponseEntity<Map<String, Object>> gastosPorCategoriaPeriodo(
            @RequestParam Long casalId,
            @RequestParam String dataInicio,
            @RequestParam String dataFim
    ) {
        return ResponseEntity.ok(relatorioService.gastosPorCategoriaCustom(casalId, LocalDate.parse(dataInicio), LocalDate.parse(dataFim)));
    }

    @GetMapping("/comparacao-parceiros/periodo")
    public ResponseEntity<Map<String, Object>> comparacaoParceirosPeriodo(
            @RequestParam Long casalId,
            @RequestParam String dataInicio,
            @RequestParam String dataFim
    ) {
        return ResponseEntity.ok(relatorioService.comparacaoParceiroCustom(casalId, LocalDate.parse(dataInicio), LocalDate.parse(dataFim)));
    }
}

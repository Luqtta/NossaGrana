package com.nossagrana.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaldoCategoriaResponse {

    private Long categoriaId;
    private String nomeCategoria;
    private String icone;
    private String cor;
    private BigDecimal orcamentoMensal;
    private BigDecimal totalGasto;
    private BigDecimal saldo;
    private Double percentualGasto;
    private String status; // VERDE, AMARELO, VERMELHO
}

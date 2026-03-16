package com.nossagrana.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaldoCategoriaResponse {

    private Long categoriaId;
    private String nomeCategoria;
    private String icone;
    private String cor;
    private Double orcamentoMensal;
    private Double totalGasto;
    private Double saldo;
    private Double percentualGasto;
    private String status; // VERDE, AMARELO, VERMELHO
}

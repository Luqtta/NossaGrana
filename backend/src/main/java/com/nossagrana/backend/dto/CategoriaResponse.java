package com.nossagrana.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoriaResponse {
    
    private Long id;
    private String nome;
    private String icone;
    private String cor;
    private Boolean ativa;
    private Double orcamentoMensal;
}
package com.nossagrana.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DespesaResponse {
    
    private Long id;
    private LocalDate dataTransacao;
    private LocalDateTime dataCriacao;
    private String descricao;
    private BigDecimal valor;
    private String categoriaNome;
    private Long categoriaId;
    private String responsavel;
    private String tipoDespesa;
    private String metodoPagamento;
    private String observacoes;
    private String usuarioNome;
    private Boolean editada;
    private String urlComprovante;
}

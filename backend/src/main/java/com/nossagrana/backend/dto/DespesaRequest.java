package com.nossagrana.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class DespesaRequest {
    
    @NotNull(message = "Data é obrigatória")
    private LocalDate dataTransacao;
    
    @NotBlank(message = "Descrição é obrigatória")
    private String descricao;
    
    @NotNull(message = "Valor é obrigatório")
    @Positive(message = "Valor deve ser positivo")
    private BigDecimal valor;
    
    @NotNull(message = "Categoria é obrigatória")
    private Long categoriaId;
    
    @NotBlank(message = "Responsável é obrigatório")
    private String responsavel;
    
    private String tipoDespesa;
    
    private String metodoPagamento;
    
    private String observacoes;

    private String urlComprovante;
}
package com.nossagrana.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CategoriaCriarRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100)
    private String nome;

    @NotBlank(message = "Icone é obrigatório")
    @Size(max = 16)
    private String icone;

    @NotBlank(message = "Cor é obrigatória")
    @Size(max = 32)
    private String cor;

    @NotNull(message = "Orçamento é obrigatório")
    @PositiveOrZero
    private BigDecimal orcamento;

    @NotNull(message = "casalId é obrigatório")
    private Long casalId;
}

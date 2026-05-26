package com.nossagrana.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrcamentoRequest {

    @NotNull
    @PositiveOrZero
    private BigDecimal orcamento;
}

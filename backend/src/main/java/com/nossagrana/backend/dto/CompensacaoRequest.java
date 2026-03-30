package com.nossagrana.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CompensacaoRequest {

    @NotBlank(message = "Tipo é obrigatório")
    private String tipo; // EMPRESTIMO, ADIANTAMENTO_PENSAO, OUTROS

    private String descricao;

    @NotNull(message = "Valor é obrigatório")
    @Positive(message = "Valor deve ser positivo")
    private BigDecimal valor;

    @NotNull(message = "Data de referência é obrigatória")
    private LocalDate dataReferencia;

    @NotNull(message = "Usuário origem é obrigatório")
    private Long usuarioOrigemId;

    @NotNull(message = "Usuário destino é obrigatório")
    private Long usuarioDestinoId;
}

package com.nossagrana.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CompensacaoRequest {

    @NotBlank(message = "Tipo é obrigatório")
    @Pattern(regexp = "EMPRESTIMO|ADIANTAMENTO_PENSAO|OUTROS", message = "Tipo inválido")
    private String tipo;

    @Size(max = 500, message = "Descrição até 500 caracteres")
    private String descricao;

    @NotNull(message = "Valor é obrigatório")
    @Positive(message = "Valor deve ser positivo")
    @DecimalMax(value = "99999999.99", message = "Valor máximo R$ 99.999.999,99")
    private BigDecimal valor;

    @NotNull(message = "Data de referência é obrigatória")
    private LocalDate dataReferencia;

    @NotNull(message = "Usuário origem é obrigatório")
    private Long usuarioOrigemId;

    @NotNull(message = "Usuário destino é obrigatório")
    private Long usuarioDestinoId;
}

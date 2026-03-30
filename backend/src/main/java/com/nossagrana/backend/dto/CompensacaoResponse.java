package com.nossagrana.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class CompensacaoResponse {

    private Long id;
    private String tipo;
    private String descricao;
    private BigDecimal valor;
    private LocalDate dataReferencia;
    private LocalDateTime dataCriacao;
    private Long usuarioOrigemId;
    private String nomeOrigem;
    private Long usuarioDestinoId;
    private String nomeDestino;
    private Boolean ativa;
}

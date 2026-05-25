package com.nossagrana.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComprovanteResponse {
    private Long id;
    private String nome;
    private String mimeType;
    private Integer mes;
    private Integer ano;
    private Long despesaId;
    private String descricaoDespesa;
    private String usuarioNome;
    private LocalDateTime dataCriacao;
}

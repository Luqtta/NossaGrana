package com.nossagrana.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ComprovanteRequest {

    @NotBlank(message = "Nome do arquivo é obrigatório")
    private String nome;

    @NotBlank(message = "MIME type é obrigatório")
    private String mimeType;

    @NotBlank(message = "Conteúdo (base64) é obrigatório")
    private String dadosBase64;

    @NotNull(message = "Mês é obrigatório")
    private Integer mes;

    @NotNull(message = "Ano é obrigatório")
    private Integer ano;

    private Long despesaId;
}

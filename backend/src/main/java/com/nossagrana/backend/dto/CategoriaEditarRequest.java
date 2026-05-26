package com.nossagrana.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoriaEditarRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100)
    private String nome;

    @NotBlank(message = "Icone é obrigatório")
    @Size(max = 16)
    private String icone;

    @NotBlank(message = "Cor é obrigatória")
    @Size(max = 32)
    private String cor;
}

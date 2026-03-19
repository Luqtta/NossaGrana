package com.nossagrana.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AtualizarNomeRequest {
    @NotBlank(message = "Nome eh obrigatorio")
    private String nome;
}

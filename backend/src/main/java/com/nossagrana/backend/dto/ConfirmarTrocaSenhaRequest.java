package com.nossagrana.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConfirmarTrocaSenhaRequest {
    @NotBlank(message = "Codigo eh obrigatorio")
    private String codigo;

    @NotBlank(message = "Nova senha eh obrigatoria")
    private String novaSenha;
}

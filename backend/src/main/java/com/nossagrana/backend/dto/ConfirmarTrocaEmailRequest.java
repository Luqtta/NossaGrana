package com.nossagrana.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConfirmarTrocaEmailRequest {
    @NotBlank(message = "Codigo eh obrigatorio")
    private String codigo;
}

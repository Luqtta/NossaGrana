package com.nossagrana.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VerificarEmailRequest {
    @NotNull
    private Long usuarioId;
    @NotBlank
    private String codigo;
}

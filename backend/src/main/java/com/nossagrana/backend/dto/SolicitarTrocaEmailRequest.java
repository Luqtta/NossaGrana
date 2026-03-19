package com.nossagrana.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SolicitarTrocaEmailRequest {
    @NotBlank(message = "Novo email eh obrigatorio")
    @Email(message = "Email invalido")
    private String novoEmail;
}

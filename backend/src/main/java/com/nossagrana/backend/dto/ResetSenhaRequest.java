package com.nossagrana.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetSenhaRequest {
    @NotBlank
    @Email
    private String email;
    @NotBlank
    private String codigo;
    @NotBlank
    @Size(min = 8, message = "Senha deve ter no mínimo 8 caracteres")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
        message = "Senha deve conter ao menos uma letra maiúscula, uma minúscula e um número"
    )
    private String novaSenha;
}

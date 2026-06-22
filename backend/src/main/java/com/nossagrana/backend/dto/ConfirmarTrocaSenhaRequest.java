package com.nossagrana.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ConfirmarTrocaSenhaRequest {
    @NotBlank(message = "Codigo eh obrigatorio")
    private String codigo;

    /**
     * Senha atual exigida pra confirmar identidade do dono da sessao.
     * Sem isso, sessao sequestrada (notebook desbloqueado, XSS, etc.) permitiria
     * trocar a senha sem nenhuma prova de posse.
     */
    @NotBlank(message = "Senha atual eh obrigatoria")
    private String senhaAtual;

    @NotBlank(message = "Nova senha eh obrigatoria")
    @Size(min = 8, message = "Senha deve ter no minimo 8 caracteres")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
        message = "Senha deve conter ao menos uma letra maiuscula, uma minuscula e um numero"
    )
    private String novaSenha;
}

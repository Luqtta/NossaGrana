package com.nossagrana.backend.exception;

public class EmailNaoVerificadoException extends RuntimeException {

    private final Long usuarioId;

    public EmailNaoVerificadoException(Long usuarioId) {
        super("Email não verificado. Verifique sua caixa de entrada antes de continuar.");
        this.usuarioId = usuarioId;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }
}

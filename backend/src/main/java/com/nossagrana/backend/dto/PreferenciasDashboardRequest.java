package com.nossagrana.backend.dto;

import lombok.Data;

@Data
public class PreferenciasDashboardRequest {
    private String corDestaque;
    private String imagemFundoBase64;
    private String imagemFundoMime;
    private Boolean removerImagemFundo;
    private Integer opacidadeFundo;
    private String ordemCards;
    private String cardsEscondidos;
}

package com.nossagrana.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreferenciasDashboardResponse {
    private String corDestaque;
    private Boolean temImagemFundo;
    private String imagemFundoMime;
    private Integer opacidadeFundo;
    private String ordemCards;
    private String cardsEscondidos;
}

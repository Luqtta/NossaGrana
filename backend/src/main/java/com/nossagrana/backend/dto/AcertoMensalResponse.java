package com.nossagrana.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcertoMensalResponse {

    private BigDecimal totalDespesasMes;
    private BigDecimal cotaIdeal;
    private ParceiroAcerto parceiro1;
    private ParceiroAcerto parceiro2;
    private ResumoFinal resumoFinal;
    private Boolean solo;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParceiroAcerto {
        private Long usuarioId;
        private String nome;
        private BigDecimal despesasPagas;
        private BigDecimal compensacoesConcedidas;
        private BigDecimal compensacoesRecebidas;
        private BigDecimal valorLiquidoArcado;
        private BigDecimal saldoFinal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResumoFinal {
        private String quemDeve;
        private String paraQuem;
        private BigDecimal valor;
        private Boolean equilibrado;
    }
}

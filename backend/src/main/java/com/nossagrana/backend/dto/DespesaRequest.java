package com.nossagrana.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class DespesaRequest {

    @NotNull(message = "Data é obrigatória")
    private LocalDate dataTransacao;

    @NotBlank(message = "Descrição é obrigatória")
    @Size(max = 255, message = "Descrição até 255 caracteres")
    private String descricao;

    @NotNull(message = "Valor é obrigatório")
    @Positive(message = "Valor deve ser positivo")
    @DecimalMax(value = "99999999.99", message = "Valor máximo R$ 99.999.999,99")
    private BigDecimal valor;

    @NotNull(message = "Categoria é obrigatória")
    private Long categoriaId;

    @NotBlank(message = "Responsável é obrigatório")
    @Pattern(regexp = "PARCEIRO_1|PARCEIRO_2|COMPARTILHADA", message = "Responsável inválido")
    private String responsavel;

    @Pattern(regexp = "FIXA|VARIAVEL|IMPREVISTA", message = "Tipo de despesa inválido")
    private String tipoDespesa;

    @Pattern(regexp = "DINHEIRO|DEBITO|CREDITO|PIX|OUTROS", message = "Método de pagamento inválido")
    private String metodoPagamento;

    @Size(max = 2000, message = "Observações até 2000 caracteres")
    private String observacoes;

    // Limite generoso: data URL base64 de PDF/imagem 10MB cresce ~33% = ~14MB.
    // Bloqueia payloads absurdos sem cortar o caso de uso real.
    @Size(max = 15_000_000, message = "Comprovante excede o tamanho permitido")
    private String urlComprovante;

    private Boolean pago;

    private Boolean debitoAutomatico;
}
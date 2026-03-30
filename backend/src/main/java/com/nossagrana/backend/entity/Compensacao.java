package com.nossagrana.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "compensacoes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Compensacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "casal_id", nullable = false)
    private Casal casal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_origem_id", nullable = false)
    private Usuario usuarioOrigem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_destino_id", nullable = false)
    private Usuario usuarioDestino;

    @Column(nullable = false, length = 30)
    private String tipo; // EMPRESTIMO, ADIANTAMENTO_PENSAO, OUTROS

    @Column(length = 255)
    private String descricao;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(name = "data_referencia", nullable = false)
    private LocalDate dataReferencia;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false)
    private LocalDateTime dataCriacao;

    @Builder.Default
    @Column(nullable = false)
    private Boolean ativa = true;
}

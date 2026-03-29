package com.nossagrana.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "despesas")
@SQLRestriction("ativo = true")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Despesa {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "data_transacao", nullable = false)
    private LocalDate dataTransacao;
    
    @Column(length = 255)
    private String descricao;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;
    
    @Column(nullable = false, length = 20)
    private String responsavel; // PARCEIRO_1, PARCEIRO_2, COMPARTILHADA
    
    @Column(name = "tipo_despesa", length = 20)
    private String tipoDespesa; // FIXA, VARIAVEL, IMPREVISTA
    
    @Column(name = "metodo_pagamento", length = 20)
    private String metodoPagamento; // DINHEIRO, DEBITO, CREDITO, PIX
    
    @Column(columnDefinition = "TEXT")
    private String observacoes;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "casal_id")
    private Casal casal;
    
    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false)
    private LocalDateTime dataCriacao;

    @Builder.Default
    @Column(name = "editada")
    private Boolean editada = false;

    @Column(name = "url_comprovante", columnDefinition = "TEXT")
    private String urlComprovante;

    @Builder.Default
    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Builder.Default
    @Column(name = "recorrente", nullable = false)
    private Boolean recorrente = false;

    @Builder.Default
    @Column(name = "recorrencia_ativa", nullable = false)
    private Boolean recorrenciaAtiva = true;

    @Column(name = "data_cancelamento_recorrencia")
    private LocalDate dataCancelamentoRecorrencia;

    @Column(name = "despesa_origem_id")
    private Long despesaOrigemId;
}
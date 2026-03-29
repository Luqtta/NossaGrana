package com.nossagrana.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "categorias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Categoria {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String nome;
    
    @Column(length = 50)
    private String icone;
    
    @Column(length = 7)
    private String cor;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean ativa = true;

    @Builder.Default
    @Column(name = "orcamento_mensal", precision = 10, scale = 2)
    private BigDecimal orcamentoMensal = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "casal_id")
    private Casal casal;
}
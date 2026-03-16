package com.nossagrana.backend.entity;

import jakarta.persistence.*;
import lombok.*;

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
    @Column(name = "orcamento_mensal")
    private Double orcamentoMensal = 0.0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "casal_id")
    private Casal casal;
}
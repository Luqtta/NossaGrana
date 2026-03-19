package com.nossagrana.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;  

@Entity
@Table(name = "usuarios")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String nome;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    @JsonIgnore
    private String senha;
    
    @ManyToOne
    @JoinColumn(name = "casal_id")
    private Casal casal;
    
    @Builder.Default
    @Column(name = "eh_parceiro1")
    private Boolean ehParceiro1 = true;

    @Builder.Default
    @Column(name = "email_verificado")
    private Boolean emailVerificado = false;

    @Column(name = "foto_perfil", columnDefinition = "TEXT")
    private String fotoPerfil;

    @Column(name = "email_pendente")
    private String emailPendente;

    // Campo preparado para futura funcionalidade de ganhos/salario
    @Column(name = "renda_mensal")
    private Double rendaMensal;
}

package com.nossagrana.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "casais")
@Data
public class Casal {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nome_parceiro1")
    private String nomeParceiro1;
    
    @Column(name = "nome_parceiro2")
    private String nomeParceiro2;
    
    @Column(name = "email_convite_parceiro2")
    private String emailConviteParceiro2;
    
    @Column(name = "convite_aceito")
    private Boolean conviteAceito = false;
    
    @Column(name = "meta_mensal")
    private Double metaMensal = 0.0;
    
    @Column(name = "data_criacao")
    private LocalDateTime dataCriacao = LocalDateTime.now();
}
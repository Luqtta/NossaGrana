package com.nossagrana.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "comprovantes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comprovante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String nome;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Lob
    @Column(nullable = false)
    private byte[] dados;

    @Column(nullable = false)
    private Integer mes;

    @Column(nullable = false)
    private Integer ano;

    @Column(name = "despesa_id")
    private Long despesaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "casal_id", nullable = false)
    private Casal casal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false)
    private LocalDateTime dataCriacao;
}

package com.nossagrana.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "preferencias_dashboard")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreferenciasDashboard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false, unique = true)
    private Long usuarioId;

    @Column(name = "cor_destaque", length = 20)
    private String corDestaque;

    @Column(name = "imagem_fundo_mime", length = 100)
    private String imagemFundoMime;

    // LAZY: nao carrega a imagem (ate 5MB) so pra checar se existe ou ler outras
    // preferencias. So o endpoint /imagem-fundo precisa do byte[] e forca o load.
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "imagem_fundo", columnDefinition = "bytea")
    private byte[] imagemFundo;

    @Column(name = "opacidade_fundo")
    private Integer opacidadeFundo;

    @Column(name = "ordem_cards", columnDefinition = "TEXT")
    private String ordemCards;

    @Column(name = "cards_escondidos", columnDefinition = "TEXT")
    private String cardsEscondidos;
}

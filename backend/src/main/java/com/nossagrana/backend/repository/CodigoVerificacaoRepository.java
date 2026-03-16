package com.nossagrana.backend.repository;

import com.nossagrana.backend.entity.CodigoVerificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface CodigoVerificacaoRepository extends JpaRepository<CodigoVerificacao, Long> {

    Optional<CodigoVerificacao> findTopByUsuarioIdAndTipoAndUsadoFalseOrderByDataCriacaoDesc(
            Long usuarioId, CodigoVerificacao.Tipo tipo);

    @Modifying
    @Transactional
    @Query("UPDATE CodigoVerificacao c SET c.usado = true WHERE c.usuario.id = :usuarioId AND c.tipo = :tipo")
    void invalidarCodigos(Long usuarioId, CodigoVerificacao.Tipo tipo);
}

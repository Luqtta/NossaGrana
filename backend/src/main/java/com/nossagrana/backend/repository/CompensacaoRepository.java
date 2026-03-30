package com.nossagrana.backend.repository;

import com.nossagrana.backend.entity.Compensacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CompensacaoRepository extends JpaRepository<Compensacao, Long> {

    @Query("SELECT c FROM Compensacao c " +
           "JOIN FETCH c.usuarioOrigem " +
           "JOIN FETCH c.usuarioDestino " +
           "WHERE c.casal.id = :casalId " +
           "AND c.ativa = true " +
           "AND c.dataReferencia BETWEEN :inicio AND :fim " +
           "ORDER BY c.dataReferencia DESC")
    List<Compensacao> findByCasalIdAndPeriodo(
        @Param("casalId") Long casalId,
        @Param("inicio") LocalDate inicio,
        @Param("fim") LocalDate fim
    );
}

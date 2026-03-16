package com.nossagrana.backend.repository;

import com.nossagrana.backend.entity.Despesa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface DespesaRepository extends JpaRepository<Despesa, Long> {

    @Query("SELECT d FROM Despesa d WHERE d.casal.id = :casalId")
    List<Despesa> findAllByCasalId(@Param("casalId") Long casalId);

    @Query("SELECT d FROM Despesa d JOIN FETCH d.categoria JOIN FETCH d.usuario " +
           "WHERE d.casal.id = :casalId AND d.dataTransacao BETWEEN :inicio AND :fim")
    List<Despesa> findByCasalIdAndDataTransacaoBetween(
        @Param("casalId") Long casalId,
        @Param("inicio") LocalDate inicio,
        @Param("fim") LocalDate fim
    );

    @Query("SELECT d FROM Despesa d JOIN FETCH d.categoria JOIN FETCH d.usuario " +
           "WHERE d.casal.id = :casalId AND d.dataTransacao BETWEEN :inicio AND :fim " +
           "ORDER BY d.dataTransacao DESC")
    List<Despesa> findByCasalIdAndDataTransacaoBetweenOrderByDataTransacaoDesc(
        @Param("casalId") Long casalId,
        @Param("inicio") LocalDate inicio,
        @Param("fim") LocalDate fim
    );

    @Query("SELECT SUM(d.valor) FROM Despesa d " +
           "WHERE d.casal.id = :casalId " +
           "AND d.dataTransacao BETWEEN :inicio AND :fim")
    BigDecimal sumTotalByPeriodo(
        @Param("casalId") Long casalId,
        @Param("inicio") LocalDate inicio,
        @Param("fim") LocalDate fim
    );

    @Query("SELECT d FROM Despesa d JOIN FETCH d.categoria JOIN FETCH d.usuario " +
           "WHERE d.casal.id = :casalId AND d.categoria.id = :categoriaId " +
           "AND d.dataTransacao BETWEEN :inicio AND :fim")
    List<Despesa> findByCasalIdAndCategoriaIdAndDataTransacaoBetween(
        @Param("casalId") Long casalId,
        @Param("categoriaId") Long categoriaId,
        @Param("inicio") LocalDate inicio,
        @Param("fim") LocalDate fim
    );

    @Query("SELECT d FROM Despesa d JOIN FETCH d.categoria JOIN FETCH d.usuario " +
           "WHERE d.casal.id = :casalId " +
           "AND (:categoriaId IS NULL OR d.categoria.id = :categoriaId) " +
           "AND (:responsavel IS NULL OR d.responsavel = :responsavel) " +
           "AND (:descricaoPattern IS NULL OR LOWER(d.descricao) LIKE :descricaoPattern) " +
           "AND d.dataTransacao BETWEEN :dataInicio AND :dataFim " +
           "ORDER BY d.dataTransacao DESC")
    List<Despesa> filtrar(
        @Param("casalId") Long casalId,
        @Param("categoriaId") Long categoriaId,
        @Param("responsavel") String responsavel,
        @Param("descricaoPattern") String descricaoPattern,
        @Param("dataInicio") LocalDate dataInicio,
        @Param("dataFim") LocalDate dataFim
    );
}

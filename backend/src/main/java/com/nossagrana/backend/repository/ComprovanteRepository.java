package com.nossagrana.backend.repository;

import com.nossagrana.backend.entity.Comprovante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ComprovanteRepository extends JpaRepository<Comprovante, Long> {

    List<Comprovante> findByCasalIdOrderByAnoDescMesDescDataCriacaoDesc(Long casalId);

    List<Comprovante> findByCasalIdAndMesAndAnoOrderByDataCriacaoDesc(Long casalId, Integer mes, Integer ano);

    Optional<Comprovante> findByDespesaId(Long despesaId);

    void deleteByDespesaId(Long despesaId);

    @Query("SELECT DISTINCT c.ano, c.mes FROM Comprovante c WHERE c.casal.id = :casalId ORDER BY c.ano DESC, c.mes DESC")
    List<Object[]> findMesesDisponiveis(@Param("casalId") Long casalId);
}

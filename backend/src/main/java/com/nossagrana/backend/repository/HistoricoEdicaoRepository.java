package com.nossagrana.backend.repository;

import com.nossagrana.backend.entity.HistoricoEdicao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HistoricoEdicaoRepository extends JpaRepository<HistoricoEdicao, Long> {
    List<HistoricoEdicao> findByDespesaIdOrderByDataEdicaoDesc(Long despesaId);

    @Modifying
    @Query("DELETE FROM HistoricoEdicao h WHERE h.despesa.casal.id = :casalId")
    void deleteByCasalId(@Param("casalId") Long casalId);
}

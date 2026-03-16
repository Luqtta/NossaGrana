package com.nossagrana.backend.repository;

import com.nossagrana.backend.entity.HistoricoEdicao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HistoricoEdicaoRepository extends JpaRepository<HistoricoEdicao, Long> {
    List<HistoricoEdicao> findByDespesaIdOrderByDataEdicaoDesc(Long despesaId);
}

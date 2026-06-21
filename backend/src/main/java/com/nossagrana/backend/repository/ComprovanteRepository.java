package com.nossagrana.backend.repository;

import com.nossagrana.backend.dto.ComprovanteResponse;
import com.nossagrana.backend.entity.Comprovante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ComprovanteRepository extends JpaRepository<Comprovante, Long> {

    List<Comprovante> findByCasalIdAndMesAndAnoOrderByDataCriacaoDesc(Long casalId, Integer mes, Integer ano);

    Optional<Comprovante> findByDespesaId(Long despesaId);

    void deleteByDespesaId(Long despesaId);

    @Query("SELECT DISTINCT c.ano, c.mes FROM Comprovante c WHERE c.casal.id = :casalId ORDER BY c.ano DESC, c.mes DESC")
    List<Object[]> findMesesDisponiveis(@Param("casalId") Long casalId);

    /**
     * Lista comprovantes do casal SEM tocar na coluna `dados` (bytea).
     * Projeta diretamente em ComprovanteResponse via construtor JPQL.
     * Descricao da despesa vem por subquery (mesma logica do mapToResponse antigo).
     */
    @Query("SELECT new com.nossagrana.backend.dto.ComprovanteResponse(" +
           "  c.id, c.nome, c.mimeType, c.mes, c.ano, c.despesaId, " +
           "  (SELECT d.descricao FROM Despesa d WHERE d.id = c.despesaId), " +
           "  c.usuario.nome, " +
           "  c.dataCriacao" +
           ") " +
           "FROM Comprovante c " +
           "WHERE c.casal.id = :casalId " +
           "ORDER BY c.ano DESC, c.mes DESC, c.dataCriacao DESC")
    List<ComprovanteResponse> listarMetadataPorCasal(@Param("casalId") Long casalId);
}

package com.nossagrana.backend.repository;

import com.nossagrana.backend.entity.PreferenciasDashboard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PreferenciasDashboardRepository extends JpaRepository<PreferenciasDashboard, Long> {
    Optional<PreferenciasDashboard> findByUsuarioId(Long usuarioId);

    /**
     * Checa apenas se ha imagem sem carregar o byte[]. Usado pra montar a flag
     * temImagemFundo sem disparar o carregamento LAZY do bytea.
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END " +
           "FROM PreferenciasDashboard p " +
           "WHERE p.usuarioId = :usuarioId AND p.imagemFundo IS NOT NULL")
    boolean existeImagemFundo(@Param("usuarioId") Long usuarioId);
}

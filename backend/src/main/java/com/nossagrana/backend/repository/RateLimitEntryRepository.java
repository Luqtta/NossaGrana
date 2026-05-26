package com.nossagrana.backend.repository;

import com.nossagrana.backend.entity.RateLimitEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RateLimitEntryRepository extends JpaRepository<RateLimitEntry, Long> {

    @Query("SELECT COUNT(r) FROM RateLimitEntry r WHERE r.chave = :chave AND r.timestampMs >= :desde")
    long contar(@Param("chave") String chave, @Param("desde") Long desde);

    @Modifying
    @Query("DELETE FROM RateLimitEntry r WHERE r.timestampMs < :limite")
    int limparAntigos(@Param("limite") Long limite);

    @Modifying
    @Query("DELETE FROM RateLimitEntry r WHERE r.chave = :chave")
    void limparPorChave(@Param("chave") String chave);
}

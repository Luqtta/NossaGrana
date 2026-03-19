package com.nossagrana.backend.repository;

import com.nossagrana.backend.entity.Convite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConviteRepository extends JpaRepository<Convite, Long> {
    Optional<Convite> findByCodigo(String codigo);

    @Modifying
    @Query("DELETE FROM Convite c WHERE c.casal.id = :casalId")
    void deleteByCasalId(@Param("casalId") Long casalId);
}

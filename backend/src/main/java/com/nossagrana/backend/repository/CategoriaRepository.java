package com.nossagrana.backend.repository;

import com.nossagrana.backend.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    
    List<Categoria> findByCasalIdAndAtivaTrue(Long casalId);
    
    List<Categoria> findByCasalId(Long casalId);

    @Modifying
    @Query("DELETE FROM Categoria c WHERE c.casal.id = :casalId")
    void deleteByCasalId(@Param("casalId") Long casalId);
}

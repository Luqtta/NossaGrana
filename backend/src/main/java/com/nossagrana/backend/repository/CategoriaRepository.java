package com.nossagrana.backend.repository;

import com.nossagrana.backend.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    
    List<Categoria> findByCasalIdAndAtivaTrue(Long casalId);
    
    List<Categoria> findByCasalId(Long casalId);
}
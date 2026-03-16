package com.nossagrana.backend.repository;

import com.nossagrana.backend.entity.Casal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CasalRepository extends JpaRepository<Casal, Long> {
}
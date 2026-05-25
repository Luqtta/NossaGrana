package com.nossagrana.backend.repository;

import com.nossagrana.backend.entity.PreferenciasDashboard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PreferenciasDashboardRepository extends JpaRepository<PreferenciasDashboard, Long> {
    Optional<PreferenciasDashboard> findByUsuarioId(Long usuarioId);
}

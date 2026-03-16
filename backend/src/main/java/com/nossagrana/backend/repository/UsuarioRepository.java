package com.nossagrana.backend.repository;

import com.nossagrana.backend.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<Usuario> findFirstByCasalIdAndEhParceiro1(Long casalId, Boolean ehParceiro1);
}
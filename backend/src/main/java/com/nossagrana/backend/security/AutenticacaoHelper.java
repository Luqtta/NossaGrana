package com.nossagrana.backend.security;

import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.exception.ForbiddenException;
import com.nossagrana.backend.exception.ResourceNotFoundException;
import com.nossagrana.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AutenticacaoHelper {

    private final UsuarioRepository usuarioRepository;

    public Usuario getUsuarioAtual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new ForbiddenException("Não autenticado");
        }
        String email = (String) auth.getPrincipal();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    public void validarAcessoCasal(Long casalId) {
        Usuario usuario = getUsuarioAtual();
        if (usuario.getCasal() == null || !usuario.getCasal().getId().equals(casalId)) {
            throw new ForbiddenException("Acesso negado a este casal");
        }
    }
}

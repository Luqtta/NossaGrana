package com.nossagrana.backend.service;

import com.nossagrana.backend.dto.AuthResponse;
import com.nossagrana.backend.dto.UsuarioResponse;
import com.nossagrana.backend.entity.Casal;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.exception.BusinessException;
import com.nossagrana.backend.repository.CasalRepository;
import com.nossagrana.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final CasalRepository casalRepository;
    private final VerificacaoService verificacaoService;

    @Transactional
    public UsuarioResponse atualizarNome(Usuario usuario, String nome) {
        usuario.setNome(nome);
        usuarioRepository.save(usuario);

        if (usuario.getCasal() != null) {
            Casal casal = usuario.getCasal();
            if (Boolean.TRUE.equals(usuario.getEhParceiro1())) {
                casal.setNomeParceiro1(nome);
            } else {
                casal.setNomeParceiro2(nome);
            }
            casalRepository.save(casal);
        }

        return mapUsuario(usuario);
    }

    @Transactional
    public UsuarioResponse atualizarFoto(Usuario usuario, String fotoPerfil) {
        usuario.setFotoPerfil(fotoPerfil);
        usuarioRepository.save(usuario);
        return mapUsuario(usuario);
    }

    @Transactional
    public void solicitarTrocaEmail(Usuario usuario, String novoEmail) {
        usuarioRepository.findByEmail(novoEmail)
            .filter(u -> !u.getId().equals(usuario.getId()))
            .ifPresent(u -> { throw new BusinessException("Este email ja esta em uso"); });

        verificacaoService.gerarEEnviarCodigoTrocaEmail(usuario, novoEmail);
    }

    @Transactional
    public AuthResponse confirmarTrocaEmail(Usuario usuario, String codigo) {
        AuthResponse response = verificacaoService.confirmarTrocaEmail(usuario, codigo);

        if (usuario.getCasal() != null && Boolean.FALSE.equals(usuario.getEhParceiro1())) {
            Casal casal = usuario.getCasal();
            casal.setEmailConviteParceiro2(usuario.getEmail());
            casalRepository.save(casal);
        }

        return response;
    }

    @Transactional
    public void solicitarTrocaSenha(Usuario usuario) {
        verificacaoService.gerarEEnviarCodigoTrocaSenha(usuario);
    }

    @Transactional
    public void confirmarTrocaSenha(Usuario usuario, String codigo, String novaSenha) {
        verificacaoService.confirmarTrocaSenha(usuario, codigo, novaSenha);
    }

    public UsuarioResponse mapUsuario(Usuario usuario) {
        return UsuarioResponse.builder()
            .id(usuario.getId())
            .nome(usuario.getNome())
            .email(usuario.getEmail())
            .casalId(usuario.getCasal() != null ? usuario.getCasal().getId() : null)
            .ehParceiro1(usuario.getEhParceiro1())
            .fotoPerfil(usuario.getFotoPerfil())
            .build();
    }
}

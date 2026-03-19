package com.nossagrana.backend.service;

import com.nossagrana.backend.dto.AuthResponse;
import com.nossagrana.backend.dto.LoginRequest;
import com.nossagrana.backend.dto.RegisterRequest;
import com.nossagrana.backend.dto.RegisterResponse;
import com.nossagrana.backend.entity.Casal;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.exception.BusinessException;
import com.nossagrana.backend.exception.EmailNaoVerificadoException;
import com.nossagrana.backend.exception.ForbiddenException;
import com.nossagrana.backend.exception.ResourceNotFoundException;
import com.nossagrana.backend.repository.CasalRepository;
import com.nossagrana.backend.repository.UsuarioRepository;
import com.nossagrana.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final CasalRepository casalRepository;
    private final CategoriaPadraoService categoriaPadraoService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final VerificacaoService verificacaoService;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BusinessException("Email já cadastrado");
        }

        Casal novoCasal = new Casal();
        novoCasal.setNomeParceiro1(request.getNome());
        novoCasal = casalRepository.save(novoCasal);
        categoriaPadraoService.criarCategoriasPadrao(novoCasal);

        Usuario novoUsuario = new Usuario();
        novoUsuario.setNome(request.getNome());
        novoUsuario.setEmail(request.getEmail());
        novoUsuario.setSenha(passwordEncoder.encode(request.getSenha()));
        novoUsuario.setCasal(novoCasal);
        novoUsuario.setEhParceiro1(true);
        novoUsuario.setEmailVerificado(false);
        novoUsuario = usuarioRepository.save(novoUsuario);

        verificacaoService.gerarEEnviarCodigoVerificacao(novoUsuario);

        return RegisterResponse.builder()
                .usuarioId(novoUsuario.getId())
                .email(novoUsuario.getEmail())
                .nome(novoUsuario.getNome())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (!passwordEncoder.matches(request.getSenha(), usuario.getSenha())) {
            throw new ForbiddenException("Senha incorreta");
        }

        if (Boolean.FALSE.equals(usuario.getEmailVerificado())) {
            throw new EmailNaoVerificadoException(usuario.getId());
        }

        return buildAuthResponse(usuario, usuario.getCasal() != null ? usuario.getCasal().getId() : null);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken) || !jwtUtil.isRefreshToken(refreshToken)) {
            throw new ForbiddenException("Refresh token inválido ou expirado");
        }

        String email = jwtUtil.getEmailFromToken(refreshToken);
        Usuario usuario = usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        return buildAuthResponse(usuario, usuario.getCasal() != null ? usuario.getCasal().getId() : null);
    }

    private AuthResponse buildAuthResponse(Usuario usuario, Long casalId) {
        return AuthResponse.builder()
            .token(jwtUtil.generateToken(usuario.getEmail()))
            .refreshToken(jwtUtil.generateRefreshToken(usuario.getEmail()))
            .id(usuario.getId())
            .nome(usuario.getNome())
            .email(usuario.getEmail())
            .casalId(casalId)
            .ehParceiro1(usuario.getEhParceiro1())
            .fotoPerfil(usuario.getFotoPerfil())
            .build();
    }
}

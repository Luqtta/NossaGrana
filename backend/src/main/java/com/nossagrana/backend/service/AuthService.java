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
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final CasalRepository casalRepository;
    private final CategoriaPadraoService categoriaPadraoService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final VerificacaoService verificacaoService;
    private final AuditLogService auditLog;

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
        auditLog.registrar(AuditLogService.REGISTRO, novoUsuario, null);

        return RegisterResponse.builder()
                .usuarioId(novoUsuario.getId())
                .email(novoUsuario.getEmail())
                .nome(novoUsuario.getNome())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Mensagem unica para email-nao-cadastrado e senha-incorreta:
        // evita enumeracao de emails registrados.
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> {
                log.info("[AUTH] login falhou - email nao encontrado: {}", maskEmail(request.getEmail()));
                auditLog.registrarSemUsuario(AuditLogService.LOGIN_FALHA, "email nao encontrado: " + maskEmail(request.getEmail()));
                return new ForbiddenException("Email ou senha incorretos");
            });

        if (!passwordEncoder.matches(request.getSenha(), usuario.getSenha())) {
            log.info("[AUTH] login falhou - senha incorreta para usuario id={}", usuario.getId());
            auditLog.registrar(AuditLogService.LOGIN_FALHA, usuario, "senha incorreta");
            throw new ForbiddenException("Email ou senha incorretos");
        }

        if (Boolean.FALSE.equals(usuario.getEmailVerificado())) {
            log.info("[AUTH] login bloqueado - email nao verificado, usuario id={}", usuario.getId());
            auditLog.registrar(AuditLogService.LOGIN_FALHA, usuario, "email nao verificado");
            throw new EmailNaoVerificadoException(usuario.getId());
        }

        log.info("[AUTH] login ok - usuario id={}", usuario.getId());
        auditLog.registrar(AuditLogService.LOGIN_SUCESSO, usuario, null);
        return buildAuthResponse(usuario, usuario.getCasal() != null ? usuario.getCasal().getId() : null);
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int at = email.indexOf('@');
        String user = email.substring(0, at);
        String dom = email.substring(at);
        String maskedUser = user.length() <= 2 ? "**" : user.charAt(0) + "***" + user.charAt(user.length() - 1);
        return maskedUser + dom;
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken) || !jwtUtil.isRefreshToken(refreshToken)) {
            throw new ForbiddenException("Refresh token inválido ou expirado");
        }

        String email = jwtUtil.getEmailFromToken(refreshToken);
        Usuario usuario = usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        Integer versaoToken = jwtUtil.getTokenVersao(refreshToken);
        int versaoUsuario = usuario.getTokenVersao() != null ? usuario.getTokenVersao() : 0;
        if (versaoToken == null || versaoToken != versaoUsuario) {
            throw new ForbiddenException("Sessão expirada. Faça login novamente");
        }

        return buildAuthResponse(usuario, usuario.getCasal() != null ? usuario.getCasal().getId() : null);
    }

    @Transactional
    public void logout(Usuario usuario) {
        int atual = usuario.getTokenVersao() != null ? usuario.getTokenVersao() : 0;
        usuario.setTokenVersao(atual + 1);
        usuarioRepository.save(usuario);
        log.info("[AUTH] logout - usuario id={}", usuario.getId());
        auditLog.registrar(AuditLogService.LOGOUT, usuario, null);
    }

    private AuthResponse buildAuthResponse(Usuario usuario, Long casalId) {
        int versao = usuario.getTokenVersao() != null ? usuario.getTokenVersao() : 0;
        return AuthResponse.builder()
            .token(jwtUtil.generateToken(usuario.getEmail(), versao))
            .refreshToken(jwtUtil.generateRefreshToken(usuario.getEmail(), versao))
            .id(usuario.getId())
            .nome(usuario.getNome())
            .email(usuario.getEmail())
            .casalId(casalId)
            .ehParceiro1(usuario.getEhParceiro1())
            .fotoPerfil(usuario.getFotoPerfil())
            .build();
    }
}

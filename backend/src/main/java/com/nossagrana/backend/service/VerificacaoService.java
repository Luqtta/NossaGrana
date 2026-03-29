package com.nossagrana.backend.service;

import com.nossagrana.backend.dto.AuthResponse;
import com.nossagrana.backend.entity.CodigoVerificacao;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.exception.BusinessException;
import com.nossagrana.backend.exception.ResourceNotFoundException;
import com.nossagrana.backend.repository.CodigoVerificacaoRepository;
import com.nossagrana.backend.repository.UsuarioRepository;
import com.nossagrana.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class VerificacaoService {

    private final CodigoVerificacaoRepository codigoRepo;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final String CHARS = "0123456789";
    private static final int CODIGO_TAMANHO = 6;
    private static final int MAX_TENTATIVAS = 5;

    private String gerarCodigo() {
        StringBuilder sb = new StringBuilder(CODIGO_TAMANHO);
        for (int i = 0; i < CODIGO_TAMANHO; i++) {
            sb.append(CHARS.charAt(secureRandom.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

    @Transactional
    public void gerarEEnviarCodigoVerificacao(Usuario usuario) {
        codigoRepo.invalidarCodigos(usuario.getId(), CodigoVerificacao.Tipo.VERIFICACAO_EMAIL);

        String codigo = gerarCodigo();

        CodigoVerificacao cv = new CodigoVerificacao();
        cv.setUsuario(usuario);
        cv.setTipo(CodigoVerificacao.Tipo.VERIFICACAO_EMAIL);
        cv.setCodigo(codigo);
        cv.setDataExpiracao(LocalDateTime.now().plusHours(24));
        codigoRepo.save(cv);

        emailService.enviarCodigoVerificacao(usuario.getEmail(), usuario.getNome(), codigo);
    }

    @Transactional
    public AuthResponse verificarEmail(Long usuarioId, String codigo) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (Boolean.TRUE.equals(usuario.getEmailVerificado())) {
            throw new BusinessException("Email já verificado");
        }

        CodigoVerificacao cv = codigoRepo
                .findTopByUsuarioIdAndTipoAndUsadoFalseOrderByDataCriacaoDesc(usuarioId, CodigoVerificacao.Tipo.VERIFICACAO_EMAIL)
                .orElseThrow(() -> new BusinessException("Código inválido ou expirado"));

        if (cv.getDataExpiracao().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Código expirado. Solicite um novo código.");
        }

        if (cv.getTentativas() >= MAX_TENTATIVAS) {
            throw new BusinessException("Muitas tentativas incorretas. Solicite um novo código.");
        }

        if (!cv.getCodigo().equals(codigo)) {
            cv.setTentativas(cv.getTentativas() + 1);
            codigoRepo.save(cv);
            throw new BusinessException("Código incorreto");
        }

        cv.setUsado(true);
        codigoRepo.save(cv);

        usuario.setEmailVerificado(true);
        usuarioRepository.save(usuario);

        return AuthResponse.builder()
                .token(jwtUtil.generateToken(usuario.getEmail()))
                .refreshToken(jwtUtil.generateRefreshToken(usuario.getEmail()))
                .id(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .casalId(usuario.getCasal() != null ? usuario.getCasal().getId() : null)
                .ehParceiro1(usuario.getEhParceiro1())
                .fotoPerfil(usuario.getFotoPerfil())
                .build();
    }

    @Transactional
    public void gerarEEnviarCodigoTrocaEmail(Usuario usuario, String novoEmail) {
        if (novoEmail == null || novoEmail.isBlank()) {
            throw new BusinessException("Novo email invÃ¡lido");
        }

        if (novoEmail.equalsIgnoreCase(usuario.getEmail())) {
            throw new BusinessException("Este email jÃ¡ estÃ¡ em uso na sua conta");
        }

        codigoRepo.invalidarCodigos(usuario.getId(), CodigoVerificacao.Tipo.TROCA_EMAIL);

        String codigo = gerarCodigo();

        usuario.setEmailPendente(novoEmail);
        usuarioRepository.save(usuario);

        CodigoVerificacao cv = new CodigoVerificacao();
        cv.setUsuario(usuario);
        cv.setTipo(CodigoVerificacao.Tipo.TROCA_EMAIL);
        cv.setCodigo(codigo);
        cv.setDataExpiracao(LocalDateTime.now().plusMinutes(30));
        codigoRepo.save(cv);

        emailService.enviarCodigoVerificacao(novoEmail, usuario.getNome(), codigo);
    }

    @Transactional
    public AuthResponse confirmarTrocaEmail(Usuario usuario, String codigo) {
        CodigoVerificacao cv = codigoRepo
            .findTopByUsuarioIdAndTipoAndUsadoFalseOrderByDataCriacaoDesc(usuario.getId(), CodigoVerificacao.Tipo.TROCA_EMAIL)
            .orElseThrow(() -> new BusinessException("CÃ³digo invÃ¡lido ou expirado"));

        if (cv.getDataExpiracao().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Código expirado. Solicite um novo código.");
        }

        if (cv.getTentativas() >= MAX_TENTATIVAS) {
            throw new BusinessException("Muitas tentativas incorretas. Solicite um novo código.");
        }

        if (!cv.getCodigo().equals(codigo)) {
            cv.setTentativas(cv.getTentativas() + 1);
            codigoRepo.save(cv);
            throw new BusinessException("Código incorreto");
        }

        if (usuario.getEmailPendente() == null || usuario.getEmailPendente().isBlank()) {
            throw new BusinessException("Nenhum email pendente para troca");
        }

        // Revalidar se o email ainda estÃ¡ disponÃ­vel
        usuarioRepository.findByEmail(usuario.getEmailPendente())
            .filter(u -> !u.getId().equals(usuario.getId()))
            .ifPresent(u -> { throw new BusinessException("Este email jÃ¡ estÃ¡ em uso"); });

        cv.setUsado(true);
        codigoRepo.save(cv);

        String novoEmail = usuario.getEmailPendente();
        usuario.setEmail(novoEmail);
        usuario.setEmailPendente(null);
        usuario.setEmailVerificado(true);
        usuarioRepository.save(usuario);

        return AuthResponse.builder()
            .token(jwtUtil.generateToken(usuario.getEmail()))
            .refreshToken(jwtUtil.generateRefreshToken(usuario.getEmail()))
            .id(usuario.getId())
            .nome(usuario.getNome())
            .email(usuario.getEmail())
            .casalId(usuario.getCasal() != null ? usuario.getCasal().getId() : null)
            .ehParceiro1(usuario.getEhParceiro1())
            .fotoPerfil(usuario.getFotoPerfil())
            .build();
    }

    @Transactional
    public void gerarEEnviarCodigoTrocaSenha(Usuario usuario) {
        codigoRepo.invalidarCodigos(usuario.getId(), CodigoVerificacao.Tipo.TROCA_SENHA);

        String codigo = gerarCodigo();

        CodigoVerificacao cv = new CodigoVerificacao();
        cv.setUsuario(usuario);
        cv.setTipo(CodigoVerificacao.Tipo.TROCA_SENHA);
        cv.setCodigo(codigo);
        cv.setDataExpiracao(LocalDateTime.now().plusMinutes(15));
        codigoRepo.save(cv);

        emailService.enviarCodigoResetSenha(usuario.getEmail(), usuario.getNome(), codigo);
    }

    @Transactional
    public void confirmarTrocaSenha(Usuario usuario, String codigo, String novaSenha) {
        CodigoVerificacao cv = codigoRepo
            .findTopByUsuarioIdAndTipoAndUsadoFalseOrderByDataCriacaoDesc(usuario.getId(), CodigoVerificacao.Tipo.TROCA_SENHA)
            .orElseThrow(() -> new BusinessException("CÃ³digo invÃ¡lido ou expirado"));

        if (cv.getDataExpiracao().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Código expirado. Solicite um novo código.");
        }

        if (cv.getTentativas() >= MAX_TENTATIVAS) {
            throw new BusinessException("Muitas tentativas incorretas. Solicite um novo código.");
        }

        if (!cv.getCodigo().equals(codigo)) {
            cv.setTentativas(cv.getTentativas() + 1);
            codigoRepo.save(cv);
            throw new BusinessException("Código incorreto");
        }

        cv.setUsado(true);
        codigoRepo.save(cv);

        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void reenviarCodigoVerificacao(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Nenhuma conta encontrada com este email"));

        if (Boolean.TRUE.equals(usuario.getEmailVerificado())) {
            throw new BusinessException("Email já verificado");
        }

        gerarEEnviarCodigoVerificacao(usuario);
    }

    @Transactional
    public void gerarEEnviarCodigoReset(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Nenhuma conta encontrada com este email"));

        codigoRepo.invalidarCodigos(usuario.getId(), CodigoVerificacao.Tipo.RESET_SENHA);

        String codigo = gerarCodigo();

        CodigoVerificacao cv = new CodigoVerificacao();
        cv.setUsuario(usuario);
        cv.setTipo(CodigoVerificacao.Tipo.RESET_SENHA);
        cv.setCodigo(codigo);
        cv.setDataExpiracao(LocalDateTime.now().plusMinutes(15));
        codigoRepo.save(cv);

        emailService.enviarCodigoResetSenha(usuario.getEmail(), usuario.getNome(), codigo);
    }

    @Transactional
    public void resetarSenha(String email, String codigo, String novaSenha) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Nenhuma conta encontrada com este email"));

        CodigoVerificacao cv = codigoRepo
                .findTopByUsuarioIdAndTipoAndUsadoFalseOrderByDataCriacaoDesc(usuario.getId(), CodigoVerificacao.Tipo.RESET_SENHA)
                .orElseThrow(() -> new BusinessException("Código inválido ou expirado"));

        if (cv.getDataExpiracao().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Código expirado. Solicite um novo código.");
        }

        if (cv.getTentativas() >= MAX_TENTATIVAS) {
            throw new BusinessException("Muitas tentativas incorretas. Solicite um novo código.");
        }

        if (!cv.getCodigo().equals(codigo)) {
            cv.setTentativas(cv.getTentativas() + 1);
            codigoRepo.save(cv);
            throw new BusinessException("Código incorreto");
        }

        cv.setUsado(true);
        codigoRepo.save(cv);

        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(usuario);
    }
}

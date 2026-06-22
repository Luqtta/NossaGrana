package com.nossagrana.backend.service;

import com.nossagrana.backend.dto.AuthResponse;
import com.nossagrana.backend.dto.UsuarioResponse;
import com.nossagrana.backend.entity.Casal;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.exception.BusinessException;
import com.nossagrana.backend.repository.CasalRepository;
import com.nossagrana.backend.exception.ForbiddenException;
import com.nossagrana.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private static final int FOTO_MAX_BYTES = 3 * 1024 * 1024;
    private static final Set<String> FOTO_MIMES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private static final Pattern DATA_URL = Pattern.compile("^data:([\\w./+-]+);base64,(.+)$", Pattern.DOTALL);

    private final UsuarioRepository usuarioRepository;
    private final CasalRepository casalRepository;
    private final VerificacaoService verificacaoService;
    private final PasswordEncoder passwordEncoder;

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
        usuario.setFotoPerfil(validarFotoPerfil(fotoPerfil));
        usuarioRepository.save(usuario);
        return mapUsuario(usuario);
    }

    /**
     * Aceita apenas data URL com MIME image/* na whitelist e tamanho <= 3MB.
     * Defesa contra payloads como "javascript:alert(1)", SVG com script ou
     * URLs externas que poderiam virar tracking / SSRF se renderizadas.
     */
    private String validarFotoPerfil(String foto) {
        if (foto == null || foto.isBlank()) return null;
        Matcher m = DATA_URL.matcher(foto.trim());
        if (!m.matches()) {
            throw new BusinessException("Foto invalida. Envie uma imagem (JPEG/PNG/WEBP/GIF)");
        }
        String mime = m.group(1).toLowerCase();
        if (!FOTO_MIMES.contains(mime)) {
            throw new BusinessException("Tipo de imagem nao permitido");
        }
        String b64 = m.group(2);
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(b64);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Conteudo da imagem invalido");
        }
        if (bytes.length > FOTO_MAX_BYTES) {
            throw new BusinessException("Imagem excede o tamanho maximo de 3MB");
        }
        if (!conteudoBateComMimeImagem(bytes, mime)) {
            throw new BusinessException("Conteudo da imagem nao corresponde ao tipo");
        }
        return foto;
    }

    private boolean conteudoBateComMimeImagem(byte[] dados, String mime) {
        if (dados.length < 4) return false;
        switch (mime) {
            case "image/jpeg":
                return dados[0] == (byte) 0xFF && dados[1] == (byte) 0xD8 && dados[2] == (byte) 0xFF;
            case "image/png":
                return dados[0] == (byte) 0x89 && dados[1] == 'P' && dados[2] == 'N' && dados[3] == 'G';
            case "image/gif":
                return dados[0] == 'G' && dados[1] == 'I' && dados[2] == 'F' && dados[3] == '8';
            case "image/webp":
                return dados.length >= 12
                    && dados[0] == 'R' && dados[1] == 'I' && dados[2] == 'F' && dados[3] == 'F'
                    && dados[8] == 'W' && dados[9] == 'E' && dados[10] == 'B' && dados[11] == 'P';
            default:
                return false;
        }
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
    public void confirmarTrocaSenha(Usuario usuario, String senhaAtual, String codigo, String novaSenha) {
        // Defesa contra account takeover via sessao sequestrada: exige conhecimento
        // da senha atual antes de aceitar a troca, mesmo com codigo do email valido.
        if (senhaAtual == null || !passwordEncoder.matches(senhaAtual, usuario.getSenha())) {
            throw new ForbiddenException("Senha atual incorreta");
        }
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

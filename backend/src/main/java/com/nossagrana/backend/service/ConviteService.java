package com.nossagrana.backend.service;

import com.nossagrana.backend.dto.AuthResponse;
import com.nossagrana.backend.dto.ConviteInfoResponse;
import com.nossagrana.backend.entity.Casal;
import com.nossagrana.backend.entity.Convite;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.exception.BusinessException;
import com.nossagrana.backend.exception.ForbiddenException;
import com.nossagrana.backend.exception.ResourceNotFoundException;
import com.nossagrana.backend.repository.CasalRepository;
import com.nossagrana.backend.repository.CategoriaRepository;
import com.nossagrana.backend.repository.ConviteRepository;
import com.nossagrana.backend.repository.DespesaRepository;
import com.nossagrana.backend.repository.HistoricoEdicaoRepository;
import com.nossagrana.backend.repository.UsuarioRepository;
import com.nossagrana.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConviteService {

    private final ConviteRepository conviteRepository;
    private final UsuarioRepository usuarioRepository;
    private final CasalRepository casalRepository;
    private final DespesaRepository despesaRepository;
    private final HistoricoEdicaoRepository historicoEdicaoRepository;
    private final CategoriaRepository categoriaRepository;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;

    @Transactional
    public void criarConvite(Long casalId, String emailConvidado, Long usuarioId) {
        Usuario parceiro1 = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (!parceiro1.getCasal().getId().equals(casalId) || !parceiro1.getEhParceiro1()) {
            throw new ForbiddenException("Apenas o Parceiro 1 pode enviar convites");
        }

        Casal casal = casalRepository.findById(casalId)
            .orElseThrow(() -> new ResourceNotFoundException("Casal não encontrado"));

        if (casal.getConviteAceito()) {
            throw new BusinessException("Este casal já possui um parceiro");
        }

        if (parceiro1.getEmail().equalsIgnoreCase(emailConvidado)) {
            throw new BusinessException("Você não pode se convidar");
        }

        Usuario convidado = usuarioRepository.findByEmail(emailConvidado)
            .orElseThrow(() -> new BusinessException("Nenhuma conta encontrada com este email. O parceiro precisa criar uma conta primeiro."));

        if (convidado.getCasal().getConviteAceito()) {
            throw new BusinessException("Este usuário já faz parte de um casal");
        }

        Convite convite = new Convite();
        convite.setCodigo(UUID.randomUUID().toString());
        convite.setCasal(casal);
        convite.setRemetente(parceiro1);
        convite.setEmailConvidado(emailConvidado);
        convite.setDataExpiracao(LocalDateTime.now().plusHours(48));
        conviteRepository.save(convite);

        emailService.enviarConvite(emailConvidado, parceiro1.getNome(), convite.getCodigo());
    }

    @Transactional(readOnly = true)
    public ConviteInfoResponse buscarConvite(String codigo) {
        Convite convite = conviteRepository.findByCodigo(codigo)
            .orElseThrow(() -> new ResourceNotFoundException("Convite não encontrado"));

        Casal casal = convite.getCasal();

        return ConviteInfoResponse.builder()
            .nomeParceiro1(convite.getRemetente().getNome())
            .emailConvidado(convite.getEmailConvidado())
            .casalId(casal.getId())
            .expirado(LocalDateTime.now().isAfter(convite.getDataExpiracao()))
            .usado(convite.getUsado())
            .build();
    }

    @Transactional
    public AuthResponse aceitarConvite(String codigo, Long usuarioId) {
        Convite convite = conviteRepository.findByCodigo(codigo)
            .orElseThrow(() -> new ResourceNotFoundException("Convite não encontrado"));

        if (convite.getUsado()) {
            throw new BusinessException("Este convite já foi utilizado");
        }

        if (LocalDateTime.now().isAfter(convite.getDataExpiracao())) {
            throw new BusinessException("Este convite expirou");
        }

        Usuario parceiro2 = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (!parceiro2.getEmail().equalsIgnoreCase(convite.getEmailConvidado())) {
            throw new ForbiddenException("Este convite não é para o seu email");
        }

        if (parceiro2.getCasal().getConviteAceito()) {
            throw new BusinessException("Você já faz parte de um casal");
        }
        Long oldCasalId = parceiro2.getCasal().getId();

        // Link P2 to P1's casal
        Casal casalP1 = convite.getCasal();
        Usuario parceiro1 = convite.getRemetente();
        casalP1.setNomeParceiro1(parceiro1.getNome());
        casalP1.setNomeParceiro2(parceiro2.getNome());
        casalP1.setEmailConviteParceiro2(parceiro2.getEmail());
        casalP1.setConviteAceito(true);
        casalRepository.save(casalP1);

        parceiro2.setCasal(casalP1);
        parceiro2.setEhParceiro1(false);
        usuarioRepository.save(parceiro2);

        // Mark invite as used
        convite.setUsado(true);
        conviteRepository.save(convite);

        if (!oldCasalId.equals(casalP1.getId())) {
            conviteRepository.deleteByCasalId(oldCasalId);
            historicoEdicaoRepository.deleteByCasalId(oldCasalId);
            despesaRepository.deleteByCasalId(oldCasalId);
            categoriaRepository.deleteByCasalId(oldCasalId);
            casalRepository.deleteById(oldCasalId);
        }

        return AuthResponse.builder()
            .token(jwtUtil.generateToken(parceiro2.getEmail()))
            .refreshToken(jwtUtil.generateRefreshToken(parceiro2.getEmail()))
            .id(parceiro2.getId())
            .nome(parceiro2.getNome())
            .email(parceiro2.getEmail())
            .casalId(casalP1.getId())
            .ehParceiro1(false)
            .fotoPerfil(parceiro2.getFotoPerfil())
            .build();
    }
}

package com.nossagrana.backend.service;

import com.nossagrana.backend.dto.ComprovanteRequest;
import com.nossagrana.backend.dto.ComprovanteResponse;
import com.nossagrana.backend.entity.Comprovante;
import com.nossagrana.backend.entity.Despesa;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.exception.BusinessException;
import com.nossagrana.backend.exception.ForbiddenException;
import com.nossagrana.backend.exception.ResourceNotFoundException;
import com.nossagrana.backend.repository.ComprovanteRepository;
import com.nossagrana.backend.repository.DespesaRepository;
import com.nossagrana.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComprovanteService {

    private static final int MAX_SIZE_BYTES = 10 * 1024 * 1024;

    private final ComprovanteRepository comprovanteRepository;
    private final UsuarioRepository usuarioRepository;
    private final DespesaRepository despesaRepository;

    @Transactional
    public ComprovanteResponse upload(ComprovanteRequest request, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado"));

        if (usuario.getCasal() == null) {
            throw new BusinessException("Usuario sem casal");
        }

        byte[] dados = decodificarBase64(request.getDadosBase64());
        if (dados.length > MAX_SIZE_BYTES) {
            throw new BusinessException("Arquivo excede o tamanho maximo de 10MB");
        }

        Despesa despesa = null;
        if (request.getDespesaId() != null) {
            despesa = despesaRepository.findById(request.getDespesaId())
                .orElseThrow(() -> new ResourceNotFoundException("Despesa nao encontrada"));
            if (!despesa.getCasal().getId().equals(usuario.getCasal().getId())) {
                throw new ForbiddenException("Despesa nao pertence ao seu casal");
            }
            comprovanteRepository.findByDespesaId(despesa.getId())
                .ifPresent(c -> comprovanteRepository.deleteById(c.getId()));
        }

        Comprovante comprovante = Comprovante.builder()
            .nome(request.getNome())
            .mimeType(request.getMimeType())
            .dados(dados)
            .mes(request.getMes())
            .ano(request.getAno())
            .despesaId(despesa != null ? despesa.getId() : null)
            .casal(usuario.getCasal())
            .usuario(usuario)
            .build();

        Comprovante salvo = comprovanteRepository.save(comprovante);
        return mapToResponse(salvo);
    }

    public List<ComprovanteResponse> listarPorCasal(Long casalId) {
        return comprovanteRepository.findByCasalIdOrderByAnoDescMesDescDataCriacaoDesc(casalId)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    public List<ComprovanteResponse> listarPorMes(Long casalId, int mes, int ano) {
        return comprovanteRepository.findByCasalIdAndMesAndAnoOrderByDataCriacaoDesc(casalId, mes, ano)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    public Comprovante baixar(Long id, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado"));

        Comprovante comprovante = comprovanteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Comprovante nao encontrado"));

        if (!comprovante.getCasal().getId().equals(usuario.getCasal().getId())) {
            throw new ForbiddenException("Sem permissao para acessar este comprovante");
        }

        return comprovante;
    }

    @Transactional
    public void deletar(Long id, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado"));

        Comprovante comprovante = comprovanteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Comprovante nao encontrado"));

        if (!comprovante.getCasal().getId().equals(usuario.getCasal().getId())) {
            throw new ForbiddenException("Sem permissao para deletar este comprovante");
        }

        comprovanteRepository.deleteById(id);
    }

    private byte[] decodificarBase64(String dataUrlOuBase64) {
        String b64 = dataUrlOuBase64;
        int idx = b64.indexOf(",");
        if (b64.startsWith("data:") && idx > 0) {
            b64 = b64.substring(idx + 1);
        }
        try {
            return Base64.getDecoder().decode(b64);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Conteudo do arquivo invalido (base64)");
        }
    }

    private ComprovanteResponse mapToResponse(Comprovante c) {
        String descricao = null;
        if (c.getDespesaId() != null) {
            descricao = despesaRepository.findById(c.getDespesaId())
                .map(Despesa::getDescricao)
                .orElse(null);
        }
        return ComprovanteResponse.builder()
            .id(c.getId())
            .nome(c.getNome())
            .mimeType(c.getMimeType())
            .mes(c.getMes())
            .ano(c.getAno())
            .despesaId(c.getDespesaId())
            .descricaoDespesa(descricao)
            .usuarioNome(c.getUsuario() != null ? c.getUsuario().getNome() : null)
            .dataCriacao(c.getDataCriacao())
            .build();
    }
}

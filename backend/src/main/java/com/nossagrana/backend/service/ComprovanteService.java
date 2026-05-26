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
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComprovanteService {

    private static final int MAX_SIZE_BYTES = 10 * 1024 * 1024;
    private static final Set<String> MIME_PERMITIDOS = Set.of(
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf"
    );

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

        String mimeType = request.getMimeType() != null ? request.getMimeType().toLowerCase().trim() : "";
        if (!MIME_PERMITIDOS.contains(mimeType)) {
            throw new BusinessException("Tipo de arquivo nao permitido. Aceitos: JPEG, PNG, WEBP, GIF, PDF");
        }

        byte[] dados = decodificarBase64(request.getDadosBase64());
        if (dados.length > MAX_SIZE_BYTES) {
            throw new BusinessException("Arquivo excede o tamanho maximo de 10MB");
        }
        if (!conteudoBateComMime(dados, mimeType)) {
            throw new BusinessException("Conteudo do arquivo nao corresponde ao tipo informado");
        }

        String nomeSanitizado = sanitizarNomeArquivo(request.getNome());

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
            .nome(nomeSanitizado)
            .mimeType(mimeType)
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

    private String sanitizarNomeArquivo(String nome) {
        if (nome == null || nome.isBlank()) return "comprovante";
        // remove path traversal, CR/LF, aspas, caracteres de controle
        String limpo = nome.replaceAll("[\\\\/\\r\\n\"\\u0000-\\u001f]", "").trim();
        if (limpo.length() > 200) limpo = limpo.substring(0, 200);
        return limpo.isEmpty() ? "comprovante" : limpo;
    }

    /**
     * Confere a assinatura (magic bytes) do conteudo. Defesa contra MIME forjado
     * (ex.: SVG renomeado para image/png ou HTML pra application/pdf).
     */
    private boolean conteudoBateComMime(byte[] dados, String mime) {
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
            case "application/pdf":
                return dados[0] == '%' && dados[1] == 'P' && dados[2] == 'D' && dados[3] == 'F';
            default:
                return false;
        }
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

package com.nossagrana.backend.service;

import com.nossagrana.backend.dto.DespesaRequest;
import com.nossagrana.backend.dto.DespesaResponse;
import com.nossagrana.backend.entity.Categoria;
import com.nossagrana.backend.entity.Despesa;
import com.nossagrana.backend.entity.HistoricoEdicao;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.exception.BusinessException;
import com.nossagrana.backend.exception.ForbiddenException;
import com.nossagrana.backend.exception.ResourceNotFoundException;
import com.nossagrana.backend.repository.CategoriaRepository;
import com.nossagrana.backend.repository.DespesaRepository;
import com.nossagrana.backend.repository.HistoricoEdicaoRepository;
import com.nossagrana.backend.repository.UsuarioRepository;
import com.nossagrana.backend.util.ArquivoValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DespesaService {

    private final DespesaRepository despesaRepository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final HistoricoEdicaoRepository historicoRepository;
    private final com.nossagrana.backend.repository.ComprovanteRepository comprovanteRepository;

    @Transactional
    public DespesaResponse criarDespesa(DespesaRequest request, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado"));

        Categoria categoria = categoriaRepository.findById(request.getCategoriaId())
            .orElseThrow(() -> new ResourceNotFoundException("Categoria nao encontrada"));

        validarCategoria(usuario, categoria);
        validarResponsavel(usuario, request.getResponsavel(), null);

        boolean isFixa = "FIXA".equalsIgnoreCase(request.getTipoDespesa());
        boolean debitoAutomatico = Boolean.TRUE.equals(request.getDebitoAutomatico());
        Boolean pagoSolicitado = request.getPago();
        boolean pago = pagoSolicitado != null ? pagoSolicitado : debitoAutomatico;

        Despesa despesa = Despesa.builder()
            .dataTransacao(request.getDataTransacao())
            .descricao(request.getDescricao())
            .valor(request.getValor())
            .categoria(categoria)
            .usuario(usuario)
            .responsavel(request.getResponsavel())
            .tipoDespesa(request.getTipoDespesa())
            .metodoPagamento(request.getMetodoPagamento())
            .observacoes(request.getObservacoes())
            .urlComprovante(request.getUrlComprovante())
            .casal(usuario.getCasal())
            .recorrente(isFixa)
            .recorrenciaAtiva(true)
            .debitoAutomatico(debitoAutomatico)
            .pago(pago)
            .build();

        Despesa saved = despesaRepository.save(despesa);
        sincronizarComprovante(saved, request.getUrlComprovante(), usuario);
        return mapToResponse(saved);
    }

    private static final int MAX_BYTES_COMPROVANTE = 10 * 1024 * 1024;

    private void sincronizarComprovante(Despesa despesa, String urlComprovante, Usuario usuario) {
        if (urlComprovante == null || urlComprovante.isBlank() || !urlComprovante.startsWith("data:")) {
            return;
        }
        // Valida o data URL: whitelist MIME + magic bytes + tamanho.
        // Sem isso, atacante poderia salvar SVG malicioso e disparar XSS armazenado
        // quando o parceiro abrisse o comprovante no Historico.
        ArquivoValidator.Resultado v;
        try {
            v = ArquivoValidator.validarDataUrl(urlComprovante,
                ArquivoValidator.MIME_COMPROVANTES, MAX_BYTES_COMPROVANTE);
        } catch (BusinessException e) {
            log.warn("Comprovante rejeitado (despesa {}): {}", despesa.getId(), e.getMessage());
            throw e;
        }

        try {
            comprovanteRepository.findByDespesaId(despesa.getId())
                .ifPresent(c -> comprovanteRepository.deleteById(c.getId()));

            String extensao = v.mime.contains("pdf") ? "pdf"
                : v.mime.contains("png") ? "png"
                : v.mime.contains("webp") ? "webp"
                : v.mime.contains("gif") ? "gif"
                : "jpg";
            String nomeArquivo = "despesa-" + despesa.getId() + "-"
                + despesa.getDescricao().replaceAll("[^a-zA-Z0-9]", "_") + "." + extensao;

            com.nossagrana.backend.entity.Comprovante comp = com.nossagrana.backend.entity.Comprovante.builder()
                .nome(nomeArquivo)
                .mimeType(v.mime)
                .dados(v.dados)
                .mes(despesa.getDataTransacao().getMonthValue())
                .ano(despesa.getDataTransacao().getYear())
                .despesaId(despesa.getId())
                .casal(despesa.getCasal())
                .usuario(usuario)
                .build();
            comprovanteRepository.save(comp);
        } catch (Exception e) {
            log.warn("Falha ao sincronizar comprovante da despesa {}: {}", despesa.getId(), e.getMessage());
        }
    }

    public List<DespesaResponse> listarDespesasMes(Long casalId, int mes, int ano) {
        LocalDate inicio = LocalDate.of(ano, mes, 1);
        LocalDate fim = inicio.withDayOfMonth(inicio.lengthOfMonth());

        return despesaRepository
            .findByCasalIdAndDataTransacaoBetweenOrderByDataTransacaoDesc(casalId, inicio, fim)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public void deletarDespesa(Long despesaId, Long usuarioId) {
        Despesa despesa = despesaRepository.findById(despesaId)
            .orElseThrow(() -> new ResourceNotFoundException("Despesa nao encontrada"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado"));

        if (!despesa.getCasal().getId().equals(usuario.getCasal().getId())) {
            throw new ForbiddenException("Sem permissao para deletar esta despesa");
        }

        despesa.setAtivo(false);
        despesaRepository.save(despesa);
    }

    @Transactional
    public DespesaResponse atualizar(Long id, DespesaRequest request, Long usuarioId) {
        Despesa despesa = despesaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Despesa nao encontrada"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado"));

        if (!despesa.getCasal().getId().equals(usuario.getCasal().getId())) {
            throw new ForbiddenException("Sem permissao para editar esta despesa");
        }

        validarResponsavel(usuario, request.getResponsavel(), despesa);

        if (!despesa.getDescricao().equals(request.getDescricao())) {
            registrarEdicao(despesa, "descricao", despesa.getDescricao(), request.getDescricao(), usuario);
        }
        if (despesa.getValor().compareTo(request.getValor()) != 0) {
            registrarEdicao(despesa, "valor", despesa.getValor().toString(), request.getValor().toString(), usuario);
        }

        despesa.setDataTransacao(request.getDataTransacao());
        despesa.setDescricao(request.getDescricao());
        despesa.setValor(request.getValor());
        despesa.setResponsavel(request.getResponsavel());
        despesa.setTipoDespesa(request.getTipoDespesa());
        despesa.setMetodoPagamento(request.getMetodoPagamento());
        despesa.setObservacoes(request.getObservacoes());
        despesa.setUrlComprovante(request.getUrlComprovante());
        if (request.getDebitoAutomatico() != null) {
            despesa.setDebitoAutomatico(request.getDebitoAutomatico());
        }
        if (request.getPago() != null) {
            despesa.setPago(request.getPago());
        }
        despesa.setEditada(true);

        sincronizarComprovante(despesa, request.getUrlComprovante(), usuario);

        // Mantém consistência: se mudou para não-FIXA, desativa recorrência
        if (!"FIXA".equalsIgnoreCase(request.getTipoDespesa()) && Boolean.TRUE.equals(despesa.getRecorrente())) {
            despesa.setRecorrente(false);
            despesa.setRecorrenciaAtiva(false);
            despesa.setDataCancelamentoRecorrencia(LocalDate.now());
        }

        return mapToResponse(despesaRepository.save(despesa));
    }

    @Transactional
    public DespesaResponse cancelarRecorrencia(Long id, Long usuarioId) {
        Despesa despesa = despesaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Despesa nao encontrada"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado"));

        if (!despesa.getCasal().getId().equals(usuario.getCasal().getId())) {
            throw new ForbiddenException("Sem permissao para cancelar esta recorrencia");
        }

        if (!Boolean.TRUE.equals(despesa.getRecorrente())) {
            throw new BusinessException("Esta despesa nao e recorrente");
        }

        if (!Boolean.TRUE.equals(despesa.getRecorrenciaAtiva())) {
            throw new BusinessException("Recorrencia ja esta cancelada");
        }

        // Se é uma instância gerada, cancela a origem também
        Long origemId = despesa.getDespesaOrigemId() != null ? despesa.getDespesaOrigemId() : id;
        despesaRepository.findById(origemId).ifPresent(origem -> {
            origem.setRecorrenciaAtiva(false);
            origem.setDataCancelamentoRecorrencia(LocalDate.now());
            despesaRepository.save(origem);
        });

        // Se não é a origem, cancela ela mesma também (por consistência)
        if (despesa.getDespesaOrigemId() != null) {
            despesa.setRecorrenciaAtiva(false);
            despesa.setDataCancelamentoRecorrencia(LocalDate.now());
            despesaRepository.save(despesa);
        }

        return mapToResponse(despesaRepository.findById(origemId).orElse(despesa));
    }

    /**
     * Chamado pelo scheduler diariamente.
     * Gera instâncias das despesas fixas recorrentes ativas cuja data de
     * recorrência (mesmo dia do mês da despesa origem) já chegou no mês corrente.
     */
    @Transactional
    public void gerarInstanciasMensais() {
        LocalDate hoje = LocalDate.now();
        int mes = hoje.getMonthValue();
        int ano = hoje.getYear();

        List<Despesa> recorrentes = despesaRepository.findAllRecorrentesAtivas();
        log.info("Verificando geracao de instancias para {} despesas recorrentes - {}/{}", recorrentes.size(), mes, ano);

        for (Despesa origem : recorrentes) {
            // Não gera se foi cancelada antes do mês atual
            if (origem.getDataCancelamentoRecorrencia() != null) {
                LocalDate cancelamento = origem.getDataCancelamentoRecorrencia();
                if (!cancelamento.isAfter(LocalDate.of(ano, mes, 1))) {
                    continue;
                }
            }

            // Não gera no mesmo mês/ano da despesa origem (ela já é a primeira ocorrência)
            LocalDate dataOrigem = origem.getDataTransacao();
            if (dataOrigem.getYear() == ano && dataOrigem.getMonthValue() == mes) {
                continue;
            }

            // Data alvo no mês corrente: mesmo dia da despesa origem, ajustando p/ último dia do mês se necessário
            LocalDate primeiroDiaMes = LocalDate.of(ano, mes, 1);
            int diaAlvo = Math.min(dataOrigem.getDayOfMonth(), primeiroDiaMes.lengthOfMonth());
            LocalDate dataAlvo = LocalDate.of(ano, mes, diaAlvo);

            // Ainda não chegou o dia da recorrência
            if (hoje.isBefore(dataAlvo)) {
                continue;
            }

            // Evita duplicatas
            if (despesaRepository.existeInstanciaParaMes(origem.getId(), mes, ano)) {
                continue;
            }

            boolean debitoAutomatico = Boolean.TRUE.equals(origem.getDebitoAutomatico());

            Despesa instancia = Despesa.builder()
                .dataTransacao(dataAlvo)
                .descricao(origem.getDescricao())
                .valor(origem.getValor())
                .categoria(origem.getCategoria())
                .usuario(origem.getUsuario())
                .responsavel(origem.getResponsavel())
                .tipoDespesa(origem.getTipoDespesa())
                .metodoPagamento(origem.getMetodoPagamento())
                .observacoes(origem.getObservacoes())
                .casal(origem.getCasal())
                .recorrente(true)
                .recorrenciaAtiva(true)
                .despesaOrigemId(origem.getId())
                .debitoAutomatico(debitoAutomatico)
                .pago(debitoAutomatico)
                .build();

            despesaRepository.save(instancia);
            log.info("Instancia gerada para origem {} em {} (debito automatico={})", origem.getId(), dataAlvo, debitoAutomatico);
        }
    }

    @Transactional
    public DespesaResponse alternarPago(Long despesaId, Long usuarioId) {
        Despesa despesa = despesaRepository.findById(despesaId)
            .orElseThrow(() -> new ResourceNotFoundException("Despesa nao encontrada"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado"));

        if (!despesa.getCasal().getId().equals(usuario.getCasal().getId())) {
            throw new ForbiddenException("Sem permissao para alterar esta despesa");
        }

        despesa.setPago(!Boolean.TRUE.equals(despesa.getPago()));
        return mapToResponse(despesaRepository.save(despesa));
    }

    private void registrarEdicao(Despesa despesa, String campo, String valorAntigo, String valorNovo, Usuario usuario) {
        HistoricoEdicao historico = HistoricoEdicao.builder()
            .despesa(despesa)
            .campoAlterado(campo)
            .valorAntigo(valorAntigo)
            .valorNovo(valorNovo)
            .dataEdicao(LocalDateTime.now())
            .usuario(usuario)
            .build();
        historicoRepository.save(historico);
    }

    public List<HistoricoEdicao> buscarHistorico(Long despesaId, Long usuarioId) {
        // Valida que a despesa pertence ao casal do usuario antes de expor o historico.
        // Sem isso, qualquer usuario autenticado conseguiria ler historico de
        // despesas de OUTROS casais por enumeracao de IDs (IDOR).
        Despesa despesa = despesaRepository.findById(despesaId)
            .orElseThrow(() -> new ResourceNotFoundException("Despesa nao encontrada"));
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado"));
        if (usuario.getCasal() == null
                || !despesa.getCasal().getId().equals(usuario.getCasal().getId())) {
            throw new ForbiddenException("Sem permissao para ver este historico");
        }
        return historicoRepository.findByDespesaIdOrderByDataEdicaoDesc(despesaId);
    }

    public List<DespesaResponse> filtrar(Long casalId, Long categoriaId, String responsavel, String tipoDespesa, String descricao, LocalDate dataInicio, LocalDate dataFim) {
        String descricaoPattern = descricao != null && !descricao.isBlank() ? "%" + descricao.toLowerCase() + "%" : null;
        return despesaRepository.filtrar(casalId, categoriaId, responsavel, tipoDespesa, descricaoPattern, dataInicio, dataFim)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    private DespesaResponse mapToResponse(Despesa despesa) {
        return DespesaResponse.builder()
            .id(despesa.getId())
            .dataTransacao(despesa.getDataTransacao())
            .dataCriacao(despesa.getDataCriacao())
            .descricao(despesa.getDescricao())
            .valor(despesa.getValor())
            .categoriaNome(despesa.getCategoria().getNome())
            .categoriaId(despesa.getCategoria().getId())
            .responsavel(despesa.getResponsavel())
            .tipoDespesa(despesa.getTipoDespesa())
            .metodoPagamento(despesa.getMetodoPagamento())
            .observacoes(despesa.getObservacoes())
            .usuarioNome(despesa.getUsuario().getNome())
            .editada(despesa.getEditada())
            .urlComprovante(despesa.getUrlComprovante())
            .recorrente(despesa.getRecorrente())
            .recorrenciaAtiva(despesa.getRecorrenciaAtiva())
            .despesaOrigemId(despesa.getDespesaOrigemId())
            .pago(despesa.getPago())
            .debitoAutomatico(despesa.getDebitoAutomatico())
            .build();
    }

    private void validarResponsavel(Usuario usuario, String responsavel, Despesa despesaAtual) {
        boolean casalAceito = usuario.getCasal() != null && Boolean.TRUE.equals(usuario.getCasal().getConviteAceito());
        if (!casalAceito) {
            if ("PARCEIRO_1".equals(responsavel)) {
                return;
            }
            if (despesaAtual != null && responsavel.equals(despesaAtual.getResponsavel())) {
                return;
            }
            throw new BusinessException("Conta solo permite apenas responsavel do Parceiro 1");
        }

        if (!"PARCEIRO_1".equals(responsavel) && !"PARCEIRO_2".equals(responsavel) && !"COMPARTILHADA".equals(responsavel)) {
            throw new BusinessException("Responsavel invalido");
        }
    }

    private void validarCategoria(Usuario usuario, Categoria categoria) {
        if (usuario.getCasal() == null) {
            throw new BusinessException("Usuario sem casal");
        }
        if (categoria.getCasal() == null || !categoria.getCasal().getId().equals(usuario.getCasal().getId())) {
            throw new ForbiddenException("Categoria nao pertence ao seu casal");
        }
    }
}

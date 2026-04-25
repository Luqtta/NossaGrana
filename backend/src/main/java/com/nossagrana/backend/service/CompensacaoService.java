package com.nossagrana.backend.service;

import com.nossagrana.backend.dto.AcertoMensalResponse;
import com.nossagrana.backend.dto.AcertoMensalResponse.ParceiroAcerto;
import com.nossagrana.backend.dto.AcertoMensalResponse.ResumoFinal;
import com.nossagrana.backend.dto.CompensacaoRequest;
import com.nossagrana.backend.dto.CompensacaoResponse;
import com.nossagrana.backend.entity.Casal;
import com.nossagrana.backend.entity.Compensacao;
import com.nossagrana.backend.entity.Despesa;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.exception.BusinessException;
import com.nossagrana.backend.exception.ForbiddenException;
import com.nossagrana.backend.exception.ResourceNotFoundException;
import com.nossagrana.backend.repository.CasalRepository;
import com.nossagrana.backend.repository.CompensacaoRepository;
import com.nossagrana.backend.repository.DespesaRepository;
import com.nossagrana.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompensacaoService {

    private final CompensacaoRepository compensacaoRepository;
    private final CasalRepository casalRepository;
    private final UsuarioRepository usuarioRepository;
    private final DespesaRepository despesaRepository;

    private static final List<String> TIPOS_VALIDOS = List.of("EMPRESTIMO", "ADIANTAMENTO_PENSAO", "OUTROS");

    @Transactional
    public CompensacaoResponse criar(CompensacaoRequest request, Long usuarioLogadoId) {
        Usuario usuarioLogado = buscarUsuario(usuarioLogadoId);
        Casal casal = usuarioLogado.getCasal();
        if (casal == null) {
            throw new BusinessException("Usuário não possui casal vinculado");
        }

        validarTipo(request.getTipo());

        Usuario usuarioOrigem = buscarUsuarioDoCasal(request.getUsuarioOrigemId(), casal.getId());
        Usuario usuarioDestino = buscarUsuarioDoCasal(request.getUsuarioDestinoId(), casal.getId());

        if (usuarioOrigem.getId().equals(usuarioDestino.getId())) {
            throw new BusinessException("Origem e destino não podem ser o mesmo usuário");
        }

        Compensacao compensacao = Compensacao.builder()
                .casal(casal)
                .usuarioOrigem(usuarioOrigem)
                .usuarioDestino(usuarioDestino)
                .tipo(request.getTipo())
                .descricao(request.getDescricao())
                .valor(request.getValor())
                .dataReferencia(request.getDataReferencia())
                .build();

        return mapToResponse(compensacaoRepository.save(compensacao));
    }

    public List<CompensacaoResponse> listarPorMes(Long casalId, int mes, int ano) {
        LocalDate inicio = LocalDate.of(ano, mes, 1);
        LocalDate fim = inicio.withDayOfMonth(inicio.lengthOfMonth());
        return compensacaoRepository.findByCasalIdAndPeriodo(casalId, inicio, fim)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CompensacaoResponse atualizar(Long id, CompensacaoRequest request, Long usuarioLogadoId) {
        Compensacao compensacao = buscarPorIdValidado(id, usuarioLogadoId);

        validarTipo(request.getTipo());

        Long casalId = compensacao.getCasal().getId();
        Usuario novoOrigem = buscarUsuarioDoCasal(request.getUsuarioOrigemId(), casalId);
        Usuario novoDestino = buscarUsuarioDoCasal(request.getUsuarioDestinoId(), casalId);

        if (novoOrigem.getId().equals(novoDestino.getId())) {
            throw new BusinessException("Origem e destino não podem ser o mesmo usuário");
        }

        compensacao.setTipo(request.getTipo());
        compensacao.setDescricao(request.getDescricao());
        compensacao.setValor(request.getValor());
        compensacao.setDataReferencia(request.getDataReferencia());
        compensacao.setUsuarioOrigem(novoOrigem);
        compensacao.setUsuarioDestino(novoDestino);

        return mapToResponse(compensacaoRepository.save(compensacao));
    }

    @Transactional
    public void inativar(Long id, Long usuarioLogadoId) {
        Compensacao compensacao = buscarPorIdValidado(id, usuarioLogadoId);
        compensacao.setAtiva(false);
        compensacaoRepository.save(compensacao);
    }

    public AcertoMensalResponse calcularAcerto(Long casalId, int mes, int ano) {
        casalRepository.findById(casalId)
                .orElseThrow(() -> new ResourceNotFoundException("Casal não encontrado"));

        Optional<Usuario> p1Opt = usuarioRepository.findFirstByCasalIdAndEhParceiro1(casalId, true);
        Optional<Usuario> p2Opt = usuarioRepository.findFirstByCasalIdAndEhParceiro1(casalId, false);

        if (p1Opt.isEmpty() || p2Opt.isEmpty()) {
            return AcertoMensalResponse.builder()
                    .solo(true)
                    .totalDespesasMes(BigDecimal.ZERO)
                    .cotaIdeal(BigDecimal.ZERO)
                    .build();
        }

        Usuario p1 = p1Opt.get();
        Usuario p2 = p2Opt.get();

        LocalDate inicio = LocalDate.of(ano, mes, 1);
        LocalDate fim = inicio.withDayOfMonth(inicio.lengthOfMonth());

        // Despesas do mês
        List<Despesa> despesas = despesaRepository.findByCasalIdAndDataTransacaoBetween(casalId, inicio, fim);

        BigDecimal totalP1 = somaPor(despesas, "PARCEIRO_1");
        BigDecimal totalP2 = somaPor(despesas, "PARCEIRO_2");
        BigDecimal totalComp = somaPor(despesas, "COMPARTILHADA");
        BigDecimal totalDespesas = totalP1.add(totalP2).add(totalComp);

        // Compensações do mês
        List<Compensacao> compensacoes = compensacaoRepository.findByCasalIdAndPeriodo(casalId, inicio, fim);

        BigDecimal concP1 = somaCompensacoes(compensacoes, p1.getId(), true);
        BigDecimal recP1 = somaCompensacoes(compensacoes, p1.getId(), false);
        BigDecimal concP2 = somaCompensacoes(compensacoes, p2.getId(), true);
        BigDecimal recP2 = somaCompensacoes(compensacoes, p2.getId(), false);

        BigDecimal cotaIdeal = totalP1.add(totalP2).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal gastoMesP1 = totalP1;
        BigDecimal gastoMesP2 = totalP2;

        // Valor liquido arcado = gasto no mes + compensacoes liquidas (concedidas - recebidas)
        BigDecimal liquidoP1 = gastoMesP1.add(concP1.subtract(recP1));
        BigDecimal liquidoP2 = gastoMesP2.add(concP2.subtract(recP2));

        BigDecimal saldoP1 = liquidoP1.subtract(cotaIdeal);
        BigDecimal saldoP2 = liquidoP2.subtract(cotaIdeal);

        ResumoFinal resumo = calcularResumo(p1.getNome(), p2.getNome(), saldoP1);

        return AcertoMensalResponse.builder()
                .solo(false)
                .totalDespesasMes(totalDespesas)
                .cotaIdeal(cotaIdeal)
                .parceiro1(ParceiroAcerto.builder()
                        .usuarioId(p1.getId())
                        .nome(p1.getNome())
                        .despesasPagas(gastoMesP1)
                        .compensacoesConcedidas(concP1)
                        .compensacoesRecebidas(recP1)
                        .valorLiquidoArcado(liquidoP1)
                        .saldoFinal(saldoP1)
                        .build())
                .parceiro2(ParceiroAcerto.builder()
                        .usuarioId(p2.getId())
                        .nome(p2.getNome())
                        .despesasPagas(gastoMesP2)
                        .compensacoesConcedidas(concP2)
                        .compensacoesRecebidas(recP2)
                        .valorLiquidoArcado(liquidoP2)
                        .saldoFinal(saldoP2)
                        .build())
                .resumoFinal(resumo)
                .build();
    }

    // --- helpers privados ---

    private BigDecimal somaPor(List<Despesa> despesas, String responsavel) {
        return despesas.stream()
                .filter(d -> responsavel.equals(d.getResponsavel()))
                .map(Despesa::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal somaCompensacoes(List<Compensacao> compensacoes, Long usuarioId, boolean comoOrigem) {
        return compensacoes.stream()
                .filter(c -> comoOrigem
                        ? c.getUsuarioOrigem().getId().equals(usuarioId)
                        : c.getUsuarioDestino().getId().equals(usuarioId))
                .map(Compensacao::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private ResumoFinal calcularResumo(String nomeP1, String nomeP2, BigDecimal saldoP1) {
        BigDecimal threshold = new BigDecimal("0.01");
        if (saldoP1.abs().compareTo(threshold) < 0) {
            return ResumoFinal.builder()
                    .equilibrado(true)
                    .valor(BigDecimal.ZERO)
                    .build();
        }
        if (saldoP1.compareTo(BigDecimal.ZERO) > 0) {
            // P1 arcou mais → P2 deve para P1
            return ResumoFinal.builder()
                    .equilibrado(false)
                    .quemDeve(nomeP2)
                    .paraQuem(nomeP1)
                    .valor(saldoP1)
                    .build();
        }
        // P2 arcou mais → P1 deve para P2
        return ResumoFinal.builder()
                .equilibrado(false)
                .quemDeve(nomeP1)
                .paraQuem(nomeP2)
                .valor(saldoP1.negate())
                .build();
    }

    private Compensacao buscarPorIdValidado(Long id, Long usuarioLogadoId) {
        Compensacao compensacao = compensacaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Compensação não encontrada"));
        Usuario usuario = buscarUsuario(usuarioLogadoId);
        if (usuario.getCasal() == null || !compensacao.getCasal().getId().equals(usuario.getCasal().getId())) {
            throw new ForbiddenException("Acesso negado a esta compensação");
        }
        return compensacao;
    }

    private Usuario buscarUsuario(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    private Usuario buscarUsuarioDoCasal(Long usuarioId, Long casalId) {
        Usuario usuario = buscarUsuario(usuarioId);
        if (usuario.getCasal() == null || !usuario.getCasal().getId().equals(casalId)) {
            throw new BusinessException("Usuário não pertence ao casal");
        }
        return usuario;
    }

    private void validarTipo(String tipo) {
        if (!TIPOS_VALIDOS.contains(tipo)) {
            throw new BusinessException("Tipo inválido. Valores aceitos: " + TIPOS_VALIDOS);
        }
    }

    private CompensacaoResponse mapToResponse(Compensacao c) {
        return CompensacaoResponse.builder()
                .id(c.getId())
                .tipo(c.getTipo())
                .descricao(c.getDescricao())
                .valor(c.getValor())
                .dataReferencia(c.getDataReferencia())
                .dataCriacao(c.getDataCriacao())
                .usuarioOrigemId(c.getUsuarioOrigem().getId())
                .nomeOrigem(c.getUsuarioOrigem().getNome())
                .usuarioDestinoId(c.getUsuarioDestino().getId())
                .nomeDestino(c.getUsuarioDestino().getNome())
                .ativa(c.getAtiva())
                .build();
    }
}

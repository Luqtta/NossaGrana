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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DespesaService {

    private final DespesaRepository despesaRepository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final HistoricoEdicaoRepository historicoRepository;

    @Transactional
    public DespesaResponse criarDespesa(DespesaRequest request, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado"));

        Categoria categoria = categoriaRepository.findById(request.getCategoriaId())
            .orElseThrow(() -> new ResourceNotFoundException("Categoria nao encontrada"));

        validarCategoria(usuario, categoria);
        validarResponsavel(usuario, request.getResponsavel(), null);

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
            .build();

        Despesa saved = despesaRepository.save(despesa);
        return mapToResponse(saved);
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
        despesa.setEditada(true);

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

    public List<HistoricoEdicao> buscarHistorico(Long despesaId) {
        return historicoRepository.findByDespesaIdOrderByDataEdicaoDesc(despesaId);
    }

    public List<DespesaResponse> filtrar(Long casalId, Long categoriaId, String responsavel, String descricao, LocalDate dataInicio, LocalDate dataFim) {
        String descricaoPattern = descricao != null && !descricao.isBlank() ? "%" + descricao.toLowerCase() + "%" : null;
        return despesaRepository.filtrar(casalId, categoriaId, responsavel, descricaoPattern, dataInicio, dataFim)
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

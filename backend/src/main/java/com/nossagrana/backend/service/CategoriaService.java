package com.nossagrana.backend.service;

import com.nossagrana.backend.dto.CategoriaResponse;
import com.nossagrana.backend.dto.SaldoCategoriaResponse;
import com.nossagrana.backend.entity.Casal;
import com.nossagrana.backend.entity.Categoria;
import com.nossagrana.backend.entity.Despesa;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.exception.ForbiddenException;
import com.nossagrana.backend.repository.CasalRepository;
import com.nossagrana.backend.repository.CategoriaRepository;
import com.nossagrana.backend.repository.DespesaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final DespesaRepository despesaRepository;
    private final CasalRepository casalRepository;

    public List<CategoriaResponse> listarPorCasal(Long casalId) {
        return categoriaRepository.findByCasalIdAndAtivaTrue(casalId)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    private CategoriaResponse mapToResponse(Categoria categoria) {
        return CategoriaResponse.builder()
            .id(categoria.getId())
            .nome(categoria.getNome())
            .icone(categoria.getIcone())
            .cor(categoria.getCor())
            .ativa(categoria.getAtiva())
            .orcamentoMensal(categoria.getOrcamentoMensal())
            .build();
    }

    public void definirOrcamento(Long categoriaId, Double orcamento, Usuario usuario) {
        Categoria categoria = categoriaRepository.findById(categoriaId)
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
        validarPropriedade(categoria, usuario);
        categoria.setOrcamentoMensal(orcamento);
        categoriaRepository.save(categoria);
    }

    public SaldoCategoriaResponse buscarSaldoCategoria(Long categoriaId, int mes, int ano, Usuario usuario) {
        Categoria categoria = categoriaRepository.findById(categoriaId)
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
        validarPropriedade(categoria, usuario);

        LocalDate primeiroDia = LocalDate.of(ano, mes, 1);
        LocalDate ultimoDia = primeiroDia.withDayOfMonth(primeiroDia.lengthOfMonth());

        List<Despesa> despesas = despesaRepository.findByCasalIdAndCategoriaIdAndDataTransacaoBetween(
            categoria.getCasal().getId(), categoriaId, primeiroDia, ultimoDia
        );

        double totalGasto = despesas.stream()
            .mapToDouble(d -> d.getValor().doubleValue())
            .sum();

        double orcamento = categoria.getOrcamentoMensal() != null ? categoria.getOrcamentoMensal() : 0.0;
        double saldo = orcamento - totalGasto;
        double percentual = orcamento > 0 ? (totalGasto / orcamento) * 100 : 0;

        String status;
        if (saldo < 0) {
            status = "VERMELHO";
        } else if (percentual >= 80) {
            status = "AMARELO";
        } else {
            status = "VERDE";
        }

        return SaldoCategoriaResponse.builder()
            .categoriaId(categoria.getId())
            .nomeCategoria(categoria.getNome())
            .icone(categoria.getIcone())
            .cor(categoria.getCor())
            .orcamentoMensal(orcamento)
            .totalGasto(totalGasto)
            .saldo(saldo)
            .percentualGasto(percentual)
            .status(status)
            .build();
    }

    public Categoria criar(String nome, String icone, String cor, Double orcamento, Long casalId) {
        Casal casal = casalRepository.findById(casalId)
            .orElseThrow(() -> new RuntimeException("Casal não encontrado"));

        Categoria categoria = Categoria.builder()
            .nome(nome)
            .icone(icone)
            .cor(cor)
            .ativa(true)
            .orcamentoMensal(orcamento)
            .casal(casal)
            .build();

        return categoriaRepository.save(categoria);
    }

    public void editar(Long categoriaId, String nome, String icone, String cor, Usuario usuario) {
        Categoria categoria = categoriaRepository.findById(categoriaId)
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
        validarPropriedade(categoria, usuario);

        categoria.setNome(nome);
        categoria.setIcone(icone);
        categoria.setCor(cor);

        categoriaRepository.save(categoria);
    }

    public void desativar(Long categoriaId, Usuario usuario) {
        Categoria categoria = categoriaRepository.findById(categoriaId)
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
        validarPropriedade(categoria, usuario);

        categoria.setAtiva(false);
        categoriaRepository.save(categoria);
    }

    private void validarPropriedade(Categoria categoria, Usuario usuario) {
        if (usuario.getCasal() == null || !categoria.getCasal().getId().equals(usuario.getCasal().getId())) {
            throw new ForbiddenException("Acesso negado a esta categoria");
        }
    }
}

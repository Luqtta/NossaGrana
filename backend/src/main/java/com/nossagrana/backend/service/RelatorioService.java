package com.nossagrana.backend.service;

import com.nossagrana.backend.entity.Despesa;
import com.nossagrana.backend.repository.DespesaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RelatorioService {

    private final DespesaRepository despesaRepository;

    public Map<String, Object> gastosPorCategoria(Long casalId, int mes, int ano) {
        LocalDate inicio = LocalDate.of(ano, mes, 1);
        LocalDate fim = inicio.withDayOfMonth(inicio.lengthOfMonth());
        List<Despesa> despesas = despesaRepository.findByCasalIdAndDataTransacaoBetween(casalId, inicio, fim);
        return buildGastosPorCategoria(despesas);
    }

    public Map<String, Object> gastosPorCategoriaCustom(Long casalId, LocalDate inicio, LocalDate fim) {
        List<Despesa> despesas = despesaRepository.findByCasalIdAndDataTransacaoBetween(casalId, inicio, fim);
        return buildGastosPorCategoria(despesas);
    }

    public Map<String, Object> evolucaoMensal(Long casalId, int ano) {
        List<String> meses = Arrays.asList("Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez");

        // 1 query agregada com GROUP BY no DB — substitui 12 queries que carregavam
        // entidades inteiras (incluindo urlComprovante em base64) so pra somar valor.
        Map<Integer, Double> somasPorMes = new HashMap<>();
        for (Object[] linha : despesaRepository.totaisPorMesNoAno(casalId, ano)) {
            Integer mes = ((Number) linha[0]).intValue();
            Double soma = linha[1] != null ? ((Number) linha[1]).doubleValue() : 0.0;
            somasPorMes.put(mes, soma);
        }

        List<Double> valores = new ArrayList<>(12);
        for (int mes = 1; mes <= 12; mes++) {
            valores.add(somasPorMes.getOrDefault(mes, 0.0));
        }

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("meses", meses);
        resultado.put("valores", valores);
        return resultado;
    }

    public Map<String, Object> comparacaoParceiros(Long casalId, int mes, int ano) {
        LocalDate inicio = LocalDate.of(ano, mes, 1);
        LocalDate fim = inicio.withDayOfMonth(inicio.lengthOfMonth());
        List<Despesa> despesas = despesaRepository.findByCasalIdAndDataTransacaoBetween(casalId, inicio, fim);
        return buildComparacaoParceiros(despesas);
    }

    public Map<String, Object> comparacaoParceiroCustom(Long casalId, LocalDate inicio, LocalDate fim) {
        List<Despesa> despesas = despesaRepository.findByCasalIdAndDataTransacaoBetween(casalId, inicio, fim);
        return buildComparacaoParceiros(despesas);
    }

    private Map<String, Object> buildGastosPorCategoria(List<Despesa> despesas) {
        Map<String, Double> gastosPorCat = new LinkedHashMap<>();
        Map<String, String> cores = new LinkedHashMap<>();
        Map<String, String> icones = new LinkedHashMap<>();

        despesas.forEach(d -> {
            String nome = d.getCategoria().getNome();
            gastosPorCat.merge(nome, d.getValor().doubleValue(), Double::sum);
            cores.put(nome, d.getCategoria().getCor());
            icones.put(nome, d.getCategoria().getIcone());
        });

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("categorias", gastosPorCat.keySet());
        resultado.put("valores", gastosPorCat.values());
        resultado.put("cores", cores);
        resultado.put("icones", icones);
        return resultado;
    }

    private Map<String, Object> buildComparacaoParceiros(List<Despesa> despesas) {
        Map<String, Map<String, Double>> gastos = new LinkedHashMap<>();

        despesas.forEach(d -> {
            String categoria = d.getCategoria().getNome();
            String responsavel = d.getResponsavel();
            gastos.putIfAbsent(categoria, new HashMap<>());
            gastos.get(categoria).merge(responsavel, d.getValor().doubleValue(), Double::sum);
        });

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("categorias", gastos.keySet());
        resultado.put("dados", gastos);
        return resultado;
    }
}

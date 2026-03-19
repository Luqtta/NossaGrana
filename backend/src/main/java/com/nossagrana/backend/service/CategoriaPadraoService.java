package com.nossagrana.backend.service;

import com.nossagrana.backend.entity.Casal;
import com.nossagrana.backend.entity.Categoria;
import com.nossagrana.backend.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaPadraoService {

    private final CategoriaRepository categoriaRepository;

    private static final List<Object[]> CATEGORIAS_PADRAO = List.of(
        new Object[]{"Alimentacao", "🍔", "#10b981"},
        new Object[]{"Transporte", "🚗", "#3b82f6"},
        new Object[]{"Moradia", "🏠", "#8b5cf6"},
        new Object[]{"Saude", "💊", "#ef4444"},
        new Object[]{"Lazer", "🎮", "#f59e0b"},
        new Object[]{"Educacao", "📚", "#06b6d4"},
        new Object[]{"Vestuario", "👕", "#ec4899"},
        new Object[]{"Servicos", "🔧", "#6366f1"},
        new Object[]{"Impostos", "💰", "#14b8a6"},
        new Object[]{"Outros", "📦", "#64748b"}
    );
    private static final double ORCAMENTO_PADRAO = 100.0;

    public void criarCategoriasPadrao(Casal casal) {
        List<Categoria> categorias = CATEGORIAS_PADRAO.stream()
            .map(c -> Categoria.builder()
                .nome((String) c[0])
                .icone((String) c[1])
                .cor((String) c[2])
                .orcamentoMensal(ORCAMENTO_PADRAO)
                .casal(casal)
                .build())
            .toList();
        categoriaRepository.saveAll(categorias);
    }
}

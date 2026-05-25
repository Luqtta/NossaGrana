package com.nossagrana.backend.service;

import com.nossagrana.backend.dto.PreferenciasDashboardRequest;
import com.nossagrana.backend.dto.PreferenciasDashboardResponse;
import com.nossagrana.backend.entity.PreferenciasDashboard;
import com.nossagrana.backend.exception.BusinessException;
import com.nossagrana.backend.repository.PreferenciasDashboardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;

@Service
@RequiredArgsConstructor
public class PreferenciasDashboardService {

    private static final int MAX_IMAGE_BYTES = 5 * 1024 * 1024;

    private final PreferenciasDashboardRepository repository;

    @Transactional
    public PreferenciasDashboardResponse buscar(Long usuarioId) {
        PreferenciasDashboard pref = repository.findByUsuarioId(usuarioId)
            .orElseGet(() -> {
                PreferenciasDashboard nova = PreferenciasDashboard.builder()
                    .usuarioId(usuarioId)
                    .corDestaque("#10b981")
                    .opacidadeFundo(20)
                    .build();
                return repository.save(nova);
            });
        return mapToResponse(pref);
    }

    @Transactional
    public PreferenciasDashboardResponse atualizar(Long usuarioId, PreferenciasDashboardRequest request) {
        PreferenciasDashboard pref = repository.findByUsuarioId(usuarioId)
            .orElseGet(() -> PreferenciasDashboard.builder().usuarioId(usuarioId).build());

        if (request.getCorDestaque() != null) {
            pref.setCorDestaque(request.getCorDestaque());
        }
        if (request.getOpacidadeFundo() != null) {
            pref.setOpacidadeFundo(request.getOpacidadeFundo());
        }
        if (request.getOrdemCards() != null) {
            pref.setOrdemCards(request.getOrdemCards());
        }
        if (request.getCardsEscondidos() != null) {
            pref.setCardsEscondidos(request.getCardsEscondidos());
        }

        if (Boolean.TRUE.equals(request.getRemoverImagemFundo())) {
            pref.setImagemFundo(null);
            pref.setImagemFundoMime(null);
        } else if (request.getImagemFundoBase64() != null && !request.getImagemFundoBase64().isBlank()) {
            byte[] dados = decodificarBase64(request.getImagemFundoBase64());
            if (dados.length > MAX_IMAGE_BYTES) {
                throw new BusinessException("Imagem excede 5MB");
            }
            pref.setImagemFundo(dados);
            pref.setImagemFundoMime(request.getImagemFundoMime() != null ? request.getImagemFundoMime() : "image/jpeg");
        }

        return mapToResponse(repository.save(pref));
    }

    public PreferenciasDashboard buscarEntidade(Long usuarioId) {
        return repository.findByUsuarioId(usuarioId).orElse(null);
    }

    private byte[] decodificarBase64(String s) {
        String b64 = s;
        int idx = b64.indexOf(",");
        if (b64.startsWith("data:") && idx > 0) {
            b64 = b64.substring(idx + 1);
        }
        try {
            return Base64.getDecoder().decode(b64);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Imagem invalida");
        }
    }

    private PreferenciasDashboardResponse mapToResponse(PreferenciasDashboard p) {
        return PreferenciasDashboardResponse.builder()
            .corDestaque(p.getCorDestaque())
            .temImagemFundo(p.getImagemFundo() != null && p.getImagemFundo().length > 0)
            .imagemFundoMime(p.getImagemFundoMime())
            .opacidadeFundo(p.getOpacidadeFundo())
            .ordemCards(p.getOrdemCards())
            .cardsEscondidos(p.getCardsEscondidos())
            .build();
    }
}

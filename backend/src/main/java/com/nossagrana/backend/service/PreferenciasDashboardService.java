package com.nossagrana.backend.service;

import com.nossagrana.backend.dto.PreferenciasDashboardRequest;
import com.nossagrana.backend.dto.PreferenciasDashboardResponse;
import com.nossagrana.backend.entity.PreferenciasDashboard;
import com.nossagrana.backend.repository.PreferenciasDashboardRepository;
import com.nossagrana.backend.util.ArquivoValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        // Checa flag por query separada pra nao disparar o load LAZY do byte[].
        boolean temImagem = repository.existeImagemFundo(usuarioId);
        return mapToResponse(pref, temImagem);
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
            // Validacao com whitelist de MIME + magic bytes. Sem isso, atacante poderia
            // setar mimeType "image/svg+xml" com SVG malicioso e disparar XSS quando o
            // backend devolvesse a imagem com aquele Content-Type.
            ArquivoValidator.Resultado v = ArquivoValidator.validarDataUrl(
                request.getImagemFundoBase64(),
                ArquivoValidator.MIME_IMAGENS,
                MAX_IMAGE_BYTES
            );
            pref.setImagemFundo(v.dados);
            // mime definido pela validacao (do data URL), nao mais pelo campo opcional do request
            pref.setImagemFundoMime(v.mime);
        }

        PreferenciasDashboard salvo = repository.save(pref);
        // Apos save, o byte[] em memoria pode ter sido setado/nulled diretamente
        // — usamos a referencia em memoria pra montar a flag sem nova query.
        boolean temImagem = salvo.getImagemFundo() != null && salvo.getImagemFundo().length > 0;
        return mapToResponse(salvo, temImagem);
    }

    @Transactional(readOnly = true)
    public PreferenciasDashboard buscarEntidade(Long usuarioId) {
        PreferenciasDashboard pref = repository.findByUsuarioId(usuarioId).orElse(null);
        // Forca o load do byte[] LAZY enquanto a transacao esta aberta
        // (o controller le getImagemFundo() depois). Sem isso, dependeria de OSIV.
        if (pref != null) {
            byte[] dados = pref.getImagemFundo();
            if (dados != null) {
                dados.getClass(); // touch — garante load
            }
        }
        return pref;
    }

    private PreferenciasDashboardResponse mapToResponse(PreferenciasDashboard p, boolean temImagemFundo) {
        return PreferenciasDashboardResponse.builder()
            .corDestaque(p.getCorDestaque())
            .temImagemFundo(temImagemFundo)
            .imagemFundoMime(p.getImagemFundoMime())
            .opacidadeFundo(p.getOpacidadeFundo())
            .ordemCards(p.getOrdemCards())
            .cardsEscondidos(p.getCardsEscondidos())
            .build();
    }
}

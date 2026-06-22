package com.nossagrana.backend.util;

import com.nossagrana.backend.exception.BusinessException;

import java.util.Base64;
import java.util.Set;

/**
 * Valida data URLs e bytes de upload contra whitelist de MIME + magic bytes.
 * Centraliza a defesa contra XSS armazenado via upload de SVG/HTML.
 */
public final class ArquivoValidator {

    public static final Set<String> MIME_COMPROVANTES = Set.of(
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf"
    );

    public static final Set<String> MIME_IMAGENS = Set.of(
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    );

    private ArquivoValidator() {}

    public static class Resultado {
        public final String mime;
        public final byte[] dados;
        public Resultado(String mime, byte[] dados) {
            this.mime = mime;
            this.dados = dados;
        }
    }

    /**
     * Decodifica e valida um data URL contra a whitelist passada.
     * Lança BusinessException com mensagem clara em qualquer falha.
     *
     * @param dataUrl       string completa "data:mime;base64,xxxx" (pode ter charset/parametros)
     * @param mimesPermitidos whitelist de MIME aceitos
     * @param maxBytes      tamanho maximo apos decode
     * @return mime sanitizado (lowercased, sem parametros) + bytes decodificados
     */
    public static Resultado validarDataUrl(String dataUrl, Set<String> mimesPermitidos, int maxBytes) {
        if (dataUrl == null || dataUrl.isBlank()) {
            throw new BusinessException("Arquivo invalido");
        }
        if (!dataUrl.startsWith("data:")) {
            throw new BusinessException("Formato invalido. Envie como data URL (data:mime;base64,...)");
        }
        int virgula = dataUrl.indexOf(',');
        if (virgula <= 5) {
            throw new BusinessException("Data URL malformado");
        }
        // "data:image/png;base64" → "image/png;base64"
        String header = dataUrl.substring(5, virgula).toLowerCase().trim();
        if (!header.endsWith(";base64")) {
            throw new BusinessException("Apenas base64 e suportado");
        }
        // pega so o MIME, descarta charset/parametros
        String mime = header.substring(0, header.length() - ";base64".length());
        int pv = mime.indexOf(';');
        if (pv >= 0) mime = mime.substring(0, pv).trim();

        if (!mimesPermitidos.contains(mime)) {
            throw new BusinessException("Tipo de arquivo nao permitido. Aceitos: " + mimesPermitidos);
        }

        byte[] dados;
        try {
            dados = Base64.getDecoder().decode(dataUrl.substring(virgula + 1));
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Conteudo do arquivo invalido (base64)");
        }
        if (dados.length > maxBytes) {
            throw new BusinessException("Arquivo excede o tamanho maximo de " + (maxBytes / (1024 * 1024)) + "MB");
        }
        if (!conteudoBateComMime(dados, mime)) {
            throw new BusinessException("Conteudo do arquivo nao corresponde ao tipo informado");
        }

        return new Resultado(mime, dados);
    }

    /** Confere os magic bytes do conteudo decodificado. Defesa contra MIME forjado. */
    public static boolean conteudoBateComMime(byte[] dados, String mime) {
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
}

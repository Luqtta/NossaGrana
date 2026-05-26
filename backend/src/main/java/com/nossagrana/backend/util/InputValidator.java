package com.nossagrana.backend.util;

import com.nossagrana.backend.exception.BusinessException;

import java.time.LocalDate;

/** Validacoes simples reutilizaveis em controllers/services. */
public final class InputValidator {

    private static final int ANO_MIN = 2000;
    private static final int ANO_MAX = 2100;

    private InputValidator() {}

    public static void validarMesAno(int mes, int ano) {
        if (mes < 1 || mes > 12) {
            throw new BusinessException("Mes invalido (1-12)");
        }
        if (ano < ANO_MIN || ano > ANO_MAX) {
            throw new BusinessException("Ano invalido (" + ANO_MIN + "-" + ANO_MAX + ")");
        }
    }

    public static void validarPeriodo(LocalDate inicio, LocalDate fim) {
        if (inicio == null || fim == null) {
            throw new BusinessException("Periodo invalido");
        }
        if (inicio.isAfter(fim)) {
            throw new BusinessException("Data de inicio nao pode ser depois da data fim");
        }
        if (inicio.getYear() < ANO_MIN || fim.getYear() > ANO_MAX) {
            throw new BusinessException("Periodo fora do intervalo permitido");
        }
        // limite defensivo: maximo 5 anos de range
        if (inicio.plusYears(5).isBefore(fim)) {
            throw new BusinessException("Periodo nao pode ser maior que 5 anos");
        }
    }
}

package com.nossagrana.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AtualizarNomesRequest {

    @Size(min = 1, max = 100)
    private String nomeParceiro1;

    @Size(min = 1, max = 100)
    private String nomeParceiro2;
}

package com.nossagrana.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConviteRequest {

    @NotBlank
    @Email
    private String email;
}

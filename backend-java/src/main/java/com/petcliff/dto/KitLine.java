package com.petcliff.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record KitLine(
        @NotNull UUID productId,
        UUID variantId,
        @NotBlank String kitSlot
) {}

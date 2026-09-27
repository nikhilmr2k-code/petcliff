package com.petcliff.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/** A cart line from the frontend: {product_id, quantity, kit_id}. */
public record CheckoutLine(
        @JsonProperty("product_id") @NotNull UUID productId,
        @Min(1) int quantity,
        @JsonProperty("kit_id") String kitId
) {}

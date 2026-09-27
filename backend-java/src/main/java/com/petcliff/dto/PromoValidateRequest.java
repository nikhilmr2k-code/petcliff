package com.petcliff.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

/** Frontend posts {code, merchandise_total} where merchandise_total is in DOLLARS. */
public record PromoValidateRequest(
        @NotBlank String code,
        @JsonProperty("merchandise_total") double merchandiseTotal
) {}

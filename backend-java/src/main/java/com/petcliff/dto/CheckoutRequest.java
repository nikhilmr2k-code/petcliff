package com.petcliff.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/** Frontend checkout payload: {items, origin_url, promo_code, zip}. */
public record CheckoutRequest(
        @NotEmpty @Valid List<CheckoutLine> items,
        @JsonProperty("origin_url") String originUrl,
        @JsonProperty("promo_code") String promoCode,
        String zip
) {}

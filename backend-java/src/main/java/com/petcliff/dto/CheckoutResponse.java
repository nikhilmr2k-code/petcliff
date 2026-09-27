package com.petcliff.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

/** Frontend reads checkout_url and redirects to it. */
public record CheckoutResponse(
        @JsonProperty("checkout_url") String checkoutUrl,
        @JsonProperty("order_id") UUID orderId,
        @JsonProperty("session_id") String sessionId
) {}

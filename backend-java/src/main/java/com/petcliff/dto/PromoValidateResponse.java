package com.petcliff.dto;

/** discount is in DOLLARS; label is a short human message shown in the cart toast. */
public record PromoValidateResponse(
        boolean valid,
        String code,
        String kind,
        double discount,
        String label
) {}

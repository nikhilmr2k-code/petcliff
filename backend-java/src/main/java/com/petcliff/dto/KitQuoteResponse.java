package com.petcliff.dto;

public record KitQuoteResponse(
        int itemCount,
        int minItemsForDiscount,
        int discountPercent,
        int subtotalCents,
        int discountCents,
        int totalCents,
        boolean discountApplied
) {}

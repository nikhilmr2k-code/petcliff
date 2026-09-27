package com.petcliff.dto;

public record ReferralResponse(
        String code,
        String shareUrl,
        String giveMessage
) {}

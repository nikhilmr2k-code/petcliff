package com.petcliff.dto;

import java.util.UUID;

public record AuthResponse(
        UUID customerId,
        String email,
        String firstName,
        String lastName,
        boolean admin,
        String accessToken,
        String refreshToken
) {}

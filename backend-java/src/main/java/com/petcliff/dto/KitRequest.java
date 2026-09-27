package com.petcliff.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record KitRequest(
        @NotEmpty @Valid List<KitLine> items
) {}

package com.petcliff.controller;

import com.petcliff.dto.PromoValidateRequest;
import com.petcliff.dto.PromoValidateResponse;
import com.petcliff.service.PromotionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/promo")
public class PromoController {

    private final PromotionService promotionService;

    public PromoController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @PostMapping("/validate")
    public PromoValidateResponse validate(@Valid @RequestBody PromoValidateRequest request) {
        int subtotalCents = (int) Math.round(request.merchandiseTotal() * 100);
        return promotionService.validate(request.code(), subtotalCents);
    }
}

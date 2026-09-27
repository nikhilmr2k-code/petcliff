package com.petcliff.service;

import com.petcliff.dto.PromoValidateResponse;
import com.petcliff.entity.PromotionCode;
import com.petcliff.exception.ApiException;
import com.petcliff.repository.PromotionCodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;

@Service
public class PromotionService {

    private final PromotionCodeRepository promotionCodeRepository;

    public PromotionService(PromotionCodeRepository promotionCodeRepository) {
        this.promotionCodeRepository = promotionCodeRepository;
    }

    /** Validate a code and compute the discount for a given subtotal, without consuming it. */
    public PromoValidateResponse validate(String code, int subtotalCents) {
        Optional<PromotionCode> found = promotionCodeRepository.findById(code.trim().toUpperCase());
        if (found.isEmpty()) {
            return new PromoValidateResponse(false, code, null, 0.0, "Code not found");
        }
        PromotionCode promo = found.get();
        String problem = problem(promo);
        if (problem != null) {
            return new PromoValidateResponse(false, promo.getCode(), promo.getKind(), 0.0, problem);
        }
        int discountCents = discountFor(promo, subtotalCents);
        return new PromoValidateResponse(true, promo.getCode(), promo.getKind(),
                discountCents / 100.0, label(promo));
    }

    private static String label(PromotionCode promo) {
        return switch (promo.getKind()) {
            case "percent" -> promo.getValue() + "% off";
            case "fixed", "referral" -> "$" + (promo.getValue() / 100) + " off";
            default -> "Applied";
        };
    }

    /** Discount amount in cents, capped at the subtotal. */
    public int discountFor(PromotionCode promo, int subtotalCents) {
        int discount = switch (promo.getKind()) {
            case "percent" -> Math.round(subtotalCents * (promo.getValue() / 100f));
            case "fixed", "referral" -> promo.getValue();
            default -> 0;
        };
        return Math.min(discount, subtotalCents);
    }

    /** Load a usable promo or throw. Returns null-safe entity for order use. */
    public PromotionCode requireUsable(String code) {
        PromotionCode promo = promotionCodeRepository.findById(code.trim().toUpperCase())
                .orElseThrow(() -> ApiException.badRequest("Invalid promo code"));
        String problem = problem(promo);
        if (problem != null) {
            throw ApiException.badRequest(problem);
        }
        return promo;
    }

    @Transactional
    public void recordUsage(PromotionCode promo) {
        promo.setTimesUsed(promo.getTimesUsed() + 1);
        promotionCodeRepository.save(promo);
    }

    private String problem(PromotionCode promo) {
        if (!promo.isActive()) return "Code is not active";
        if (promo.getExpiresAt() != null && promo.getExpiresAt().isBefore(OffsetDateTime.now())) {
            return "Code has expired";
        }
        if (promo.getUsageLimit() != null && promo.getTimesUsed() >= promo.getUsageLimit()) {
            return "Code usage limit reached";
        }
        return null;
    }
}

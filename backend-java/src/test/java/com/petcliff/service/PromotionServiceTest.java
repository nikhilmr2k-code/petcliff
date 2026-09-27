package com.petcliff.service;

import com.petcliff.dto.PromoValidateResponse;
import com.petcliff.entity.PromotionCode;
import com.petcliff.repository.PromotionCodeRepository;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PromotionServiceTest {

    private final PromotionCodeRepository repo = mock(PromotionCodeRepository.class);
    private final PromotionService service = new PromotionService(repo);

    private PromotionCode promo(String code, String kind, int value) {
        PromotionCode p = new PromotionCode();
        p.setCode(code);
        p.setKind(kind);
        p.setValue(value);
        p.setActive(true);
        return p;
    }

    @Test
    void percentCode_discountsBySubtotalPercentage() {
        when(repo.findById("SAVE10")).thenReturn(Optional.of(promo("SAVE10", "percent", 10)));
        assertThat(service.discountFor(promo("SAVE10", "percent", 10), 5000)).isEqualTo(500);
        PromoValidateResponse r = service.validate("save10", 5000);
        assertThat(r.valid()).isTrue();
        assertThat(r.discount()).isEqualTo(5.0); // dollars
    }

    @Test
    void fixedCode_discountsFlatCents() {
        assertThat(service.discountFor(promo("FLAT5", "fixed", 500), 5000)).isEqualTo(500);
    }

    @Test
    void referralCode_discountsFlatCents() {
        assertThat(service.discountFor(promo("GIVE10", "referral", 1000), 5000)).isEqualTo(1000);
    }

    @Test
    void discount_isCappedAtSubtotal() {
        assertThat(service.discountFor(promo("BIG", "fixed", 9999), 3000)).isEqualTo(3000);
    }

    @Test
    void unknownCode_isInvalid() {
        when(repo.findById("NOPE")).thenReturn(Optional.empty());
        assertThat(service.validate("nope", 1000).valid()).isFalse();
    }

    @Test
    void inactiveCode_isRejected() {
        PromotionCode p = promo("OFF", "percent", 10);
        p.setActive(false);
        when(repo.findById("OFF")).thenReturn(Optional.of(p));
        PromoValidateResponse r = service.validate("off", 1000);
        assertThat(r.valid()).isFalse();
        assertThat(r.label()).contains("not active");
    }

    @Test
    void expiredCode_isRejected() {
        PromotionCode p = promo("OLD", "percent", 10);
        p.setExpiresAt(OffsetDateTime.now().minusDays(1));
        when(repo.findById("OLD")).thenReturn(Optional.of(p));
        assertThat(service.validate("old", 1000).valid()).isFalse();
    }

    @Test
    void usageLimitReached_isRejected() {
        PromotionCode p = promo("MAXED", "percent", 10);
        p.setUsageLimit(5);
        p.setTimesUsed(5);
        when(repo.findById("MAXED")).thenReturn(Optional.of(p));
        assertThat(service.validate("maxed", 1000).valid()).isFalse();
    }
}

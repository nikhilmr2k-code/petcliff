package com.petcliff.service;

import com.petcliff.config.PetCliffProperties;
import com.petcliff.dto.KitLine;
import com.petcliff.dto.KitQuoteResponse;
import com.petcliff.dto.KitRequest;
import com.petcliff.entity.Product;
import com.petcliff.repository.ProductRepository;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** "Style Your Kit" pricing: 20% off only at 3+ items. */
class KitServiceTest {

    private final ProductRepository productRepository = mock(ProductRepository.class);
    private final PetCliffProperties props = new PetCliffProperties(); // defaults: minItems=3, discount=20
    private final KitService service = new KitService(productRepository, props);

    private KitRequest kitOf(int count) {
        Product p = new Product();
        p.setId(UUID.randomUUID());
        p.setPriceCents(1000); // $10 each
        when(productRepository.findById(any())).thenReturn(Optional.of(p));
        List<KitLine> lines = new ArrayList<>();
        for (int i = 0; i < count; i++) lines.add(new KitLine(UUID.randomUUID(), null, "slot" + i));
        return new KitRequest(lines);
    }

    @Test
    void threeItems_appliesTwentyPercentDiscount() {
        KitQuoteResponse q = service.quote(kitOf(3));
        assertThat(q.discountApplied()).isTrue();
        assertThat(q.subtotalCents()).isEqualTo(3000);
        assertThat(q.discountCents()).isEqualTo(600);   // 20% of 3000
        assertThat(q.totalCents()).isEqualTo(2400);
    }

    @Test
    void twoItems_noDiscount() {
        KitQuoteResponse q = service.quote(kitOf(2));
        assertThat(q.discountApplied()).isFalse();
        assertThat(q.discountCents()).isZero();
        assertThat(q.totalCents()).isEqualTo(2000);     // full retail
    }

    @Test
    void oneItem_noDiscount() {
        KitQuoteResponse q = service.quote(kitOf(1));
        assertThat(q.discountApplied()).isFalse();
        assertThat(q.discountCents()).isZero();
        assertThat(q.totalCents()).isEqualTo(1000);
    }

    @Test
    void boundary_exactlyThree_isTheThreshold() {
        assertThat(service.quote(kitOf(2)).discountApplied()).isFalse();
        assertThat(service.quote(kitOf(3)).discountApplied()).isTrue();
    }
}

package com.petcliff.service;

import com.petcliff.config.PetCliffProperties;
import com.petcliff.dto.KitLine;
import com.petcliff.dto.KitQuoteResponse;
import com.petcliff.dto.KitRequest;
import com.petcliff.entity.Product;
import com.petcliff.exception.ApiException;
import com.petcliff.repository.ProductRepository;
import org.springframework.stereotype.Service;

/**
 * "Style Your Kit" pricing. The bundle discount applies ONLY when the number of
 * items reaches the configured threshold (default 3). With fewer items, full
 * retail applies and no discount is added.
 */
@Service
public class KitService {

    private final ProductRepository productRepository;
    private final PetCliffProperties props;

    public KitService(ProductRepository productRepository, PetCliffProperties props) {
        this.productRepository = productRepository;
        this.props = props;
    }

    public KitQuoteResponse quote(KitRequest request) {
        int minItems = props.getKit().getMinItems();
        int discountPercent = props.getKit().getDiscountPercent();

        int itemCount = request.items().size();
        int subtotalCents = 0;
        for (KitLine line : request.items()) {
            Product product = productRepository.findById(line.productId())
                    .orElseThrow(() -> ApiException.notFound("Product not found: " + line.productId()));
            subtotalCents += product.getPriceCents();
        }

        boolean discountApplied = itemCount >= minItems;
        int discountCents = discountApplied
                ? Math.round(subtotalCents * (discountPercent / 100f))
                : 0;
        int totalCents = subtotalCents - discountCents;

        return new KitQuoteResponse(
                itemCount, minItems, discountPercent,
                subtotalCents, discountCents, totalCents, discountApplied);
    }
}

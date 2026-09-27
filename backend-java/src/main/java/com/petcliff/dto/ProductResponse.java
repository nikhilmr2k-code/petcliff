package com.petcliff.dto;

import com.petcliff.entity.Product;

import java.util.Map;
import java.util.UUID;

/**
 * Product shape consumed by the React storefront. Field names/units match the
 * frontend exactly: price/compareAt in DOLLARS, image, stock, group (=category),
 * pet (=petType), subtype/color/rating pulled from the product metadata JSON.
 */
public record ProductResponse(
        UUID id,
        String slug,
        String name,
        String pet,
        String group,
        String subtype,
        double price,
        Double compareAt,
        String image,
        String color,
        double rating,
        int stock,
        String description
) {
    public static ProductResponse from(Product p) {
        Map<String, Object> m = p.getMetadata() == null ? Map.of() : p.getMetadata();
        return new ProductResponse(
                p.getId(),
                p.getSlug(),
                p.getName(),
                p.getPetType(),
                p.getCategory(),
                str(m.get("subtype")),
                p.getPriceCents() / 100.0,
                p.getCompareAtCents() == null ? null : p.getCompareAtCents() / 100.0,
                p.getImageUrl(),
                str(m.get("color")),
                m.get("rating") instanceof Number n ? n.doubleValue() : 5.0,
                p.getInventoryCount(),
                p.getDescription());
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }
}

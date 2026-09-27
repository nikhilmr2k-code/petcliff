package com.petcliff.controller;

import com.petcliff.dto.ProductResponse;
import com.petcliff.entity.Product;
import com.petcliff.exception.ApiException;
import com.petcliff.repository.ProductRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /**
     * Storefront listing. Filters match the frontend Shop page:
     * pet (dog/cat), group (=category: walking/resting/grooming/toys/accessories),
     * subtype (harness/leash/bed/...), and q (free-text over name).
     */
    @GetMapping
    public List<ProductResponse> list(@RequestParam(required = false) String pet,
                                      @RequestParam(required = false) String group,
                                      @RequestParam(required = false) String subtype,
                                      @RequestParam(required = false) String q) {
        return productRepository.findAll().stream()
                .filter(p -> blank(pet) || pet.equalsIgnoreCase(p.getPetType()))
                .filter(p -> blank(group) || group.equalsIgnoreCase(p.getCategory()))
                .filter(p -> blank(subtype) || subtype.equalsIgnoreCase(metaSubtype(p)))
                .filter(p -> blank(q) || p.getName().toLowerCase().contains(q.toLowerCase()))
                .map(ProductResponse::from)
                .toList();
    }

    @GetMapping("/{slug}")
    public ProductResponse getBySlug(@PathVariable String slug) {
        return productRepository.findBySlug(slug)
                .map(ProductResponse::from)
                .orElseThrow(() -> ApiException.notFound("Product not found: " + slug));
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private static String metaSubtype(Product p) {
        Object v = p.getMetadata() == null ? null : p.getMetadata().get("subtype");
        return v == null ? "" : v.toString();
    }
}

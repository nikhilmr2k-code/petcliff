package com.petcliff.controller;

import com.petcliff.entity.Order;
import com.petcliff.entity.Product;
import com.petcliff.entity.PromotionCode;
import com.petcliff.exception.ApiException;
import com.petcliff.repository.OrderRepository;
import com.petcliff.repository.ProductRepository;
import com.petcliff.repository.PromotionCodeRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ProductRepository productRepository;
    private final PromotionCodeRepository promotionCodeRepository;
    private final OrderRepository orderRepository;

    public AdminController(ProductRepository productRepository,
                           PromotionCodeRepository promotionCodeRepository,
                           OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.promotionCodeRepository = promotionCodeRepository;
        this.orderRepository = orderRepository;
    }

    // --- Products ---
    @PostMapping("/products")
    public Product createProduct(@RequestBody Product product) {
        product.setId(null);
        return productRepository.save(product);
    }

    @PutMapping("/products/{id}")
    public Product updateProduct(@PathVariable UUID id, @RequestBody Product product) {
        if (!productRepository.existsById(id)) {
            throw ApiException.notFound("Product not found");
        }
        product.setId(id);
        return productRepository.save(product);
    }

    @DeleteMapping("/products/{id}")
    public void deleteProduct(@PathVariable UUID id) {
        productRepository.deleteById(id);
    }

    // --- Promotions ---
    @GetMapping("/promos")
    public List<PromotionCode> listPromos() {
        return promotionCodeRepository.findAll();
    }

    @PostMapping("/promos")
    public PromotionCode createPromo(@RequestBody PromotionCode promo) {
        promo.setCode(promo.getCode().trim().toUpperCase());
        return promotionCodeRepository.save(promo);
    }

    @PatchMapping("/promos/{code}/toggle")
    public PromotionCode togglePromo(@PathVariable String code) {
        PromotionCode promo = promotionCodeRepository.findById(code.trim().toUpperCase())
                .orElseThrow(() -> ApiException.notFound("Promo not found"));
        promo.setActive(!promo.isActive());
        return promotionCodeRepository.save(promo);
    }

    // --- Orders ---
    @GetMapping("/orders")
    public List<Order> allOrders() {
        return orderRepository.findAll();
    }
}

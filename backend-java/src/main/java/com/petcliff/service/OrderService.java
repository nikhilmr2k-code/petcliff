package com.petcliff.service;

import com.petcliff.config.PetCliffProperties;
import com.petcliff.dto.CheckoutLine;
import com.petcliff.dto.CheckoutRequest;
import com.petcliff.entity.Order;
import com.petcliff.entity.OrderItem;
import com.petcliff.entity.Product;
import com.petcliff.entity.PromotionCode;
import com.petcliff.exception.ApiException;
import com.petcliff.repository.OrderItemRepository;
import com.petcliff.repository.OrderRepository;
import com.petcliff.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final PromotionService promotionService;
    private final PetCliffProperties props;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        ProductRepository productRepository,
                        PromotionService promotionService,
                        PetCliffProperties props) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.promotionService = promotionService;
        this.props = props;
    }

    /**
     * Build a pending order from a checkout request. Tax is intentionally left at 0 here;
     * Stripe Tax computes the final tax at the hosted checkout based on the shipping address.
     */
    @Transactional
    public Order createPendingOrder(CheckoutRequest request, UUID customerId) {
        int subtotalCents = 0;
        // Track per-kit line counts and subtotals so the bundle discount can be applied
        // to each kit group that reaches the minimum-item threshold (mirrors the frontend).
        Map<String, Integer> kitCount = new HashMap<>();
        Map<String, Integer> kitSubtotal = new HashMap<>();

        for (CheckoutLine line : request.items()) {
            Product product = productRepository.findById(line.productId())
                    .orElseThrow(() -> ApiException.notFound("Product not found: " + line.productId()));
            if (product.getInventoryCount() < line.quantity()) {
                throw ApiException.badRequest("Insufficient stock for " + product.getName());
            }
            int lineTotal = product.getPriceCents() * line.quantity();
            subtotalCents += lineTotal;
            if (line.kitId() != null && !line.kitId().isBlank()) {
                kitCount.merge(line.kitId(), 1, Integer::sum);
                kitSubtotal.merge(line.kitId(), lineTotal, Integer::sum);
            }
        }

        int discountCents = 0;

        // Kit discount: applies only to kit groups that meet the minimum item threshold.
        int minItems = props.getKit().getMinItems();
        int pct = props.getKit().getDiscountPercent();
        for (Map.Entry<String, Integer> e : kitCount.entrySet()) {
            if (e.getValue() >= minItems) {
                discountCents += Math.round(kitSubtotal.get(e.getKey()) * (pct / 100f));
            }
        }

        // Promo / referral code discount (stacks on top of kit pricing).
        PromotionCode promo = null;
        if (request.promoCode() != null && !request.promoCode().isBlank()) {
            promo = promotionService.requireUsable(request.promoCode());
            discountCents += promotionService.discountFor(promo, subtotalCents - discountCents);
        }

        discountCents = Math.min(discountCents, subtotalCents);
        int totalCents = subtotalCents - discountCents;

        Order order = new Order();
        order.setCustomerId(customerId);
        order.setStatus("pending");
        order.setSubtotalCents(subtotalCents);
        order.setDiscountCents(discountCents);
        order.setTaxCents(0);
        order.setTotalCents(totalCents);
        // Address is collected on Stripe's hosted checkout page, not here; store empty placeholder.
        order.setShippingAddress(new HashMap<>());
        order = orderRepository.save(order);

        for (CheckoutLine line : request.items()) {
            Product product = productRepository.findById(line.productId()).orElseThrow();
            OrderItem item = new OrderItem();
            item.setOrderId(order.getId());
            item.setProductId(line.productId());
            item.setVariantId(null);
            item.setQuantity(line.quantity());
            item.setUnitPriceCents(product.getPriceCents());
            orderItemRepository.save(item);

            product.setInventoryCount(product.getInventoryCount() - line.quantity());
            productRepository.save(product);
        }

        if (promo != null) {
            promotionService.recordUsage(promo);
        }

        return order;
    }

    @Transactional
    public void markPaid(UUID orderId, String paymentIntentId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("Order not found"));
        if ("paid".equals(order.getStatus())) {
            return; // idempotent
        }
        order.setStatus("paid");
        order.setPaidAt(OffsetDateTime.now());
        order.setStripePaymentIntentId(paymentIntentId);
        orderRepository.save(order);
    }
}

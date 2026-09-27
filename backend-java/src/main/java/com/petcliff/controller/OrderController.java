package com.petcliff.controller;

import com.petcliff.entity.Order;
import com.petcliff.entity.OrderItem;
import com.petcliff.entity.Product;
import com.petcliff.exception.ApiException;
import com.petcliff.repository.OrderItemRepository;
import com.petcliff.repository.OrderRepository;
import com.petcliff.repository.ProductRepository;
import com.petcliff.security.CurrentUser;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;

    public OrderController(OrderRepository orderRepository,
                           OrderItemRepository orderItemRepository,
                           ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
    }

    /** The authenticated customer's orders, most recent first, each enriched with line items. */
    @GetMapping
    public List<Map<String, Object>> myOrders() {
        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(CurrentUser.id());
        List<Map<String, Object>> out = new ArrayList<>();
        for (Order o : orders) {
            out.add(toView(o, orderItemRepository.findByOrderId(o.getId())));
        }
        return out;
    }

    @GetMapping("/{id}")
    public Map<String, Object> getOrder(@PathVariable UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Order not found"));
        UUID me = CurrentUser.id();
        if (order.getCustomerId() == null || !order.getCustomerId().equals(me)) {
            throw ApiException.notFound("Order not found");
        }
        return toView(order, orderItemRepository.findByOrderId(id));
    }

    private Map<String, Object> toView(Order o, List<OrderItem> items) {
        List<Map<String, Object>> lines = new ArrayList<>();
        for (OrderItem it : items) {
            Product p = productRepository.findById(it.getProductId()).orElse(null);
            Map<String, Object> line = new LinkedHashMap<>();
            line.put("productId", it.getProductId());
            line.put("name", p != null ? p.getName() : "Item");
            line.put("image", p != null ? p.getImageUrl() : null);
            line.put("quantity", it.getQuantity());
            line.put("unitPriceCents", it.getUnitPriceCents());
            lines.add(line);
        }
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("id", o.getId());
        view.put("createdAt", o.getCreatedAt());
        view.put("status", o.getStatus());
        view.put("subtotalCents", o.getSubtotalCents());
        view.put("discountCents", o.getDiscountCents());
        view.put("taxCents", o.getTaxCents());
        view.put("totalCents", o.getTotalCents());
        view.put("items", lines);
        return view;
    }
}

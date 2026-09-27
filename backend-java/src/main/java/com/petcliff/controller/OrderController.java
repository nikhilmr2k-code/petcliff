package com.petcliff.controller;

import com.petcliff.entity.Order;
import com.petcliff.entity.OrderItem;
import com.petcliff.exception.ApiException;
import com.petcliff.repository.OrderItemRepository;
import com.petcliff.repository.OrderRepository;
import com.petcliff.security.CurrentUser;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public OrderController(OrderRepository orderRepository, OrderItemRepository orderItemRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @GetMapping
    public List<Order> myOrders() {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(CurrentUser.id());
    }

    @GetMapping("/{id}")
    public Map<String, Object> getOrder(@PathVariable UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Order not found"));
        UUID me = CurrentUser.id();
        if (order.getCustomerId() == null || !order.getCustomerId().equals(me)) {
            throw ApiException.notFound("Order not found");
        }
        List<OrderItem> items = orderItemRepository.findByOrderId(id);
        return Map.of("order", order, "items", items);
    }
}

package com.petcliff.repository;

import com.petcliff.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    Optional<Order> findByStripePaymentIntentId(String stripePaymentIntentId);
}

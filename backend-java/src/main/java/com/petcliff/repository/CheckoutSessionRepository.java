package com.petcliff.repository;

import com.petcliff.entity.CheckoutSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CheckoutSessionRepository extends JpaRepository<CheckoutSession, UUID> {
    Optional<CheckoutSession> findByStripeSessionId(String stripeSessionId);
}

package com.petcliff.repository;

import com.petcliff.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByReferralCode(String referralCode);
    boolean existsByEmail(String email);
    boolean existsByReferralCode(String referralCode);
}

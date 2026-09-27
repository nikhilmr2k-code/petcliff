package com.petcliff.repository;

import com.petcliff.entity.Referral;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReferralRepository extends JpaRepository<Referral, UUID> {
    List<Referral> findByReferrerCustomerId(UUID referrerCustomerId);
    List<Referral> findByCode(String code);
}

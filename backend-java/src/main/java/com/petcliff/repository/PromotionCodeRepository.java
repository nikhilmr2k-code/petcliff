package com.petcliff.repository;

import com.petcliff.entity.PromotionCode;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromotionCodeRepository extends JpaRepository<PromotionCode, String> {
}

package com.petcliff.repository;

import com.petcliff.entity.Kit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface KitRepository extends JpaRepository<Kit, UUID> {
    List<Kit> findByCustomerId(UUID customerId);
}

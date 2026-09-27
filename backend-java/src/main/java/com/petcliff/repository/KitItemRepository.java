package com.petcliff.repository;

import com.petcliff.entity.KitItem;
import com.petcliff.entity.KitItemId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface KitItemRepository extends JpaRepository<KitItem, KitItemId> {
    List<KitItem> findByKitId(UUID kitId);
}

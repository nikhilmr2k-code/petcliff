package com.petcliff.repository;

import com.petcliff.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findBySlug(String slug);
    List<Product> findByCategory(String category);
    List<Product> findByPetType(String petType);
    List<Product> findByCategoryAndPetType(String category, String petType);
}

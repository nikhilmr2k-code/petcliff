package com.petcliff.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "kits")
public class Kit {

    @Id
    private UUID id;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(nullable = false)
    private String status = "draft";

    @Column(name = "item_count", nullable = false)
    private int itemCount = 0;

    @Column(name = "discount_percent", nullable = false)
    private BigDecimal discountPercent = new BigDecimal("20");

    @Column(name = "subtotal_cents", nullable = false)
    private int subtotalCents = 0;

    @Column(name = "total_cents", nullable = false)
    private int totalCents = 0;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getItemCount() { return itemCount; }
    public void setItemCount(int itemCount) { this.itemCount = itemCount; }
    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }
    public int getSubtotalCents() { return subtotalCents; }
    public void setSubtotalCents(int subtotalCents) { this.subtotalCents = subtotalCents; }
    public int getTotalCents() { return totalCents; }
    public void setTotalCents(int totalCents) { this.totalCents = totalCents; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}

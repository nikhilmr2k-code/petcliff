package com.petcliff.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "kit_items")
@IdClass(KitItemId.class)
public class KitItem {

    @Id
    @Column(name = "kit_id", nullable = false)
    private UUID kitId;

    @Id
    @Column(name = "kit_slot", nullable = false)
    private String kitSlot;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "variant_id")
    private UUID variantId;

    @Column(name = "unit_price_cents", nullable = false)
    private int unitPriceCents;

    public UUID getKitId() { return kitId; }
    public void setKitId(UUID kitId) { this.kitId = kitId; }
    public String getKitSlot() { return kitSlot; }
    public void setKitSlot(String kitSlot) { this.kitSlot = kitSlot; }
    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }
    public UUID getVariantId() { return variantId; }
    public void setVariantId(UUID variantId) { this.variantId = variantId; }
    public int getUnitPriceCents() { return unitPriceCents; }
    public void setUnitPriceCents(int unitPriceCents) { this.unitPriceCents = unitPriceCents; }
}

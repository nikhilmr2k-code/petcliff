package com.petcliff.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class KitItemId implements Serializable {

    private UUID kitId;
    private String kitSlot;

    public KitItemId() {}

    public KitItemId(UUID kitId, String kitSlot) {
        this.kitId = kitId;
        this.kitSlot = kitSlot;
    }

    public UUID getKitId() { return kitId; }
    public void setKitId(UUID kitId) { this.kitId = kitId; }
    public String getKitSlot() { return kitSlot; }
    public void setKitSlot(String kitSlot) { this.kitSlot = kitSlot; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof KitItemId that)) return false;
        return Objects.equals(kitId, that.kitId) && Objects.equals(kitSlot, that.kitSlot);
    }

    @Override
    public int hashCode() {
        return Objects.hash(kitId, kitSlot);
    }
}

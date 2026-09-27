package com.petcliff.entity;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "promotion_codes")
public class PromotionCode {

    @Id
    private String code;

    @Column(nullable = false)
    private String kind;

    @Column(nullable = false)
    private int value;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "times_used", nullable = false)
    private int timesUsed = 0;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }
    public int getValue() { return value; }
    public void setValue(int value) { this.value = value; }
    public Integer getUsageLimit() { return usageLimit; }
    public void setUsageLimit(Integer usageLimit) { this.usageLimit = usageLimit; }
    public int getTimesUsed() { return timesUsed; }
    public void setTimesUsed(int timesUsed) { this.timesUsed = timesUsed; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }
}

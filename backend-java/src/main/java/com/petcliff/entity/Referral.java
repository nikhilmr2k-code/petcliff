package com.petcliff.entity;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "referrals")
public class Referral {

    @Id
    private UUID id;

    @Column(name = "referrer_customer_id", nullable = false)
    private UUID referrerCustomerId;

    @Column(name = "referred_email")
    private String referredEmail;

    @Column(nullable = false)
    private String code;

    @Column(name = "reward_status", nullable = false)
    private String rewardStatus = "pending";

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getReferrerCustomerId() { return referrerCustomerId; }
    public void setReferrerCustomerId(UUID referrerCustomerId) { this.referrerCustomerId = referrerCustomerId; }
    public String getReferredEmail() { return referredEmail; }
    public void setReferredEmail(String referredEmail) { this.referredEmail = referredEmail; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getRewardStatus() { return rewardStatus; }
    public void setRewardStatus(String rewardStatus) { this.rewardStatus = rewardStatus; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}

package com.petcliff.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "tax_rates")
public class TaxRate {

    @Id
    private UUID id;

    @Column(name = "country_code", nullable = false)
    private String countryCode = "US";

    @Column(name = "state_code")
    private String stateCode;

    @Column(name = "postal_prefix")
    private String postalPrefix;

    @Column(nullable = false)
    private BigDecimal rate;

    @Column(nullable = false)
    private String source = "native_platform";

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getStateCode() { return stateCode; }
    public void setStateCode(String stateCode) { this.stateCode = stateCode; }
    public String getPostalPrefix() { return postalPrefix; }
    public void setPostalPrefix(String postalPrefix) { this.postalPrefix = postalPrefix; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }
}

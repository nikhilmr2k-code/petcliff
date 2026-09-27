package com.petcliff.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "petcliff")
public class PetCliffProperties {

    private final Jwt jwt = new Jwt();
    private final Kit kit = new Kit();
    private final Stripe stripe = new Stripe();
    private final Cors cors = new Cors();
    private final Mail mail = new Mail();
    private int freeShippingThresholdCents = 10000;
    private String frontendUrl = "https://www.petcliff.com";

    public Jwt getJwt() { return jwt; }
    public Kit getKit() { return kit; }
    public Stripe getStripe() { return stripe; }
    public Cors getCors() { return cors; }
    public Mail getMail() { return mail; }
    public int getFreeShippingThresholdCents() { return freeShippingThresholdCents; }
    public void setFreeShippingThresholdCents(int v) { this.freeShippingThresholdCents = v; }
    public String getFrontendUrl() { return frontendUrl; }
    public void setFrontendUrl(String v) { this.frontendUrl = v; }

    public static class Jwt {
        private String secret;
        private long accessTokenTtlMinutes = 30;
        private long refreshTokenTtlDays = 30;
        public String getSecret() { return secret; }
        public void setSecret(String secret) { this.secret = secret; }
        public long getAccessTokenTtlMinutes() { return accessTokenTtlMinutes; }
        public void setAccessTokenTtlMinutes(long v) { this.accessTokenTtlMinutes = v; }
        public long getRefreshTokenTtlDays() { return refreshTokenTtlDays; }
        public void setRefreshTokenTtlDays(long v) { this.refreshTokenTtlDays = v; }
    }

    public static class Kit {
        private int minItems = 3;
        private int discountPercent = 20;
        public int getMinItems() { return minItems; }
        public void setMinItems(int v) { this.minItems = v; }
        public int getDiscountPercent() { return discountPercent; }
        public void setDiscountPercent(int v) { this.discountPercent = v; }
    }

    public static class Stripe {
        private String secretKey;
        private String webhookSecret;
        private String successUrl;
        private String cancelUrl;
        public String getSecretKey() { return secretKey; }
        public void setSecretKey(String v) { this.secretKey = v; }
        public String getWebhookSecret() { return webhookSecret; }
        public void setWebhookSecret(String v) { this.webhookSecret = v; }
        public String getSuccessUrl() { return successUrl; }
        public void setSuccessUrl(String v) { this.successUrl = v; }
        public String getCancelUrl() { return cancelUrl; }
        public void setCancelUrl(String v) { this.cancelUrl = v; }
    }

    public static class Cors {
        private String allowedOrigins = "http://localhost:3000";
        public String getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(String v) { this.allowedOrigins = v; }
    }

    public static class Mail {
        private String from = "noreply@petcliff.com";
        private String region = "us-west-2";
        public String getFrom() { return from; }
        public void setFrom(String v) { this.from = v; }
        public String getRegion() { return region; }
        public void setRegion(String v) { this.region = v; }
    }
}

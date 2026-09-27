package com.petcliff.service;

import com.petcliff.config.PetCliffProperties;
import com.petcliff.entity.Order;
import com.petcliff.exception.ApiException;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class StripeService {

    private static final Logger log = LoggerFactory.getLogger(StripeService.class);

    private final PetCliffProperties props;
    private final OrderService orderService;

    public StripeService(PetCliffProperties props, OrderService orderService) {
        this.props = props;
        this.orderService = orderService;
    }

    @PostConstruct
    void init() {
        Stripe.apiKey = props.getStripe().getSecretKey();
    }

    /** True only when a real Stripe secret key is configured (not the placeholder). */
    public boolean isLive() {
        String key = props.getStripe().getSecretKey();
        return key != null && key.startsWith("sk_") && !key.contains("placeholder");
    }

    /**
     * Create a Stripe-hosted Checkout Session for an order. Card data is entered on
     * Stripe's page (never our servers) -> PCI SAQ A. automatic_tax enabled so Stripe
     * computes US state/local tax by address; we do not compute tax ourselves.
     */
    public Session createCheckoutSession(Order order) {
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(props.getStripe().getSuccessUrl() + "?order=" + order.getId())
                .setCancelUrl(props.getStripe().getCancelUrl())
                .setClientReferenceId(order.getId().toString())
                .putMetadata("orderId", order.getId().toString())
                .setAutomaticTax(
                        SessionCreateParams.AutomaticTax.builder().setEnabled(true).build())
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("usd")
                                                .setUnitAmount((long) order.getTotalCents())
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Pet Cliff Order " + order.getId())
                                                                .build())
                                                .build())
                                .build())
                .build();
        try {
            return Session.create(params);
        } catch (StripeException e) {
            log.error("Stripe checkout session creation failed", e);
            throw new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Payment session could not be created: " + e.getMessage());
        }
    }

    /** Verify the webhook signature and, on completed checkout, mark the order paid. */
    public void handleWebhook(String payload, String signatureHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, props.getStripe().getWebhookSecret());
        } catch (SignatureVerificationException e) {
            throw ApiException.badRequest("Invalid Stripe signature");
        }

        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            if (session == null) {
                log.warn("checkout.session.completed with no deserializable object");
                return;
            }
            String orderId = session.getClientReferenceId();
            if (orderId == null && session.getMetadata() != null) {
                orderId = session.getMetadata().get("orderId");
            }
            if (orderId == null) {
                log.warn("Stripe session {} had no order reference", session.getId());
                return;
            }
            orderService.markPaid(java.util.UUID.fromString(orderId), session.getPaymentIntent());
            log.info("Order {} marked paid from Stripe session {}", orderId, session.getId());
        }
    }
}

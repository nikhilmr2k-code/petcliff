package com.petcliff.controller;

import com.petcliff.dto.CheckoutRequest;
import com.petcliff.dto.CheckoutResponse;
import com.petcliff.entity.Order;
import com.petcliff.security.CurrentUser;
import com.petcliff.service.OrderService;
import com.petcliff.service.StripeService;
import com.stripe.model.checkout.Session;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class CheckoutController {

    private final OrderService orderService;
    private final StripeService stripeService;

    public CheckoutController(OrderService orderService, StripeService stripeService) {
        this.orderService = orderService;
        this.stripeService = stripeService;
    }

    /** Guest or account checkout: creates a pending order and returns a Stripe hosted checkout URL. */
    @PostMapping("/checkout")
    public CheckoutResponse checkout(@Valid @RequestBody CheckoutRequest request) {
        Order order = orderService.createPendingOrder(request, CurrentUser.idOrNull());

        if (!stripeService.isLive()) {
            // Demo mode (no real Stripe key): skip the hosted page and send the shopper
            // straight to the success screen so the flow is testable end-to-end.
            String origin = request.originUrl() != null ? request.originUrl() : "";
            String url = origin + "/payment/success?order=" + order.getId();
            return new CheckoutResponse(url, order.getId(), null);
        }

        Session session = stripeService.createCheckoutSession(order);
        return new CheckoutResponse(session.getUrl(), order.getId(), session.getId());
    }
}

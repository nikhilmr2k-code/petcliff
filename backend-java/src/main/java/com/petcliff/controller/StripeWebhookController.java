package com.petcliff.controller;

import com.petcliff.service.StripeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
public class StripeWebhookController {

    private final StripeService stripeService;

    public StripeWebhookController(StripeService stripeService) {
        this.stripeService = stripeService;
    }

    @PostMapping("/stripe")
    public ResponseEntity<String> stripe(@RequestBody String payload,
                                         @RequestHeader("Stripe-Signature") String signature) {
        stripeService.handleWebhook(payload, signature);
        return ResponseEntity.ok("ok");
    }
}

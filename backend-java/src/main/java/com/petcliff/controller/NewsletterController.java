package com.petcliff.controller;

import com.petcliff.dto.NewsletterRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/newsletter")
public class NewsletterController {

    private static final Logger log = LoggerFactory.getLogger(NewsletterController.class);

    // TODO: persist to a newsletter table or forward to an email provider (Klaviyo/Mailchimp).
    @PostMapping
    public Map<String, Object> subscribe(@Valid @RequestBody NewsletterRequest request) {
        log.info("Newsletter signup: {}", request.email());
        return Map.of("subscribed", true, "email", request.email());
    }
}

package com.petcliff.controller;

import com.petcliff.dto.ReferralResponse;
import com.petcliff.security.CurrentUser;
import com.petcliff.service.ReferralService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/referral")
public class ReferralController {

    private final ReferralService referralService;

    public ReferralController(ReferralService referralService) {
        this.referralService = referralService;
    }

    /** Returns the authenticated customer's shareable "Give $10, Get $10" referral code. */
    @GetMapping("/me")
    public ReferralResponse myReferral(@RequestParam(defaultValue = "https://petcliff.com") String baseUrl) {
        return referralService.getOrCreateForCustomer(CurrentUser.id(), baseUrl);
    }
}

package com.petcliff.service;

import com.petcliff.dto.ReferralResponse;
import com.petcliff.entity.Customer;
import com.petcliff.entity.PromotionCode;
import com.petcliff.entity.Referral;
import com.petcliff.exception.ApiException;
import com.petcliff.repository.CustomerRepository;
import com.petcliff.repository.PromotionCodeRepository;
import com.petcliff.repository.ReferralRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.UUID;

/** "Give $10, Get $10" referral engine. Each customer gets a shareable code backed by a promo. */
@Service
public class ReferralService {

    private static final int REFERRAL_VALUE_CENTS = 1000; // $10
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final SecureRandom random = new SecureRandom();

    private final CustomerRepository customerRepository;
    private final PromotionCodeRepository promotionCodeRepository;
    private final ReferralRepository referralRepository;

    public ReferralService(CustomerRepository customerRepository,
                           PromotionCodeRepository promotionCodeRepository,
                           ReferralRepository referralRepository) {
        this.customerRepository = customerRepository;
        this.promotionCodeRepository = promotionCodeRepository;
        this.referralRepository = referralRepository;
    }

    /** Return (creating if needed) the customer's shareable referral code + a backing promo. */
    @Transactional
    public ReferralResponse getOrCreateForCustomer(UUID customerId, String baseUrl) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> ApiException.notFound("Customer not found"));

        String code = customer.getReferralCode();
        if (code == null) {
            code = uniqueCode();
            customer.setReferralCode(code);
            customerRepository.save(customer);
            if (!promotionCodeRepository.existsById(code)) {
                PromotionCode promo = new PromotionCode();
                promo.setCode(code);
                promo.setKind("referral");
                promo.setValue(REFERRAL_VALUE_CENTS);
                promo.setActive(true);
                promotionCodeRepository.save(promo);
            }
        }

        String shareUrl = baseUrl + "?ref=" + code;
        return new ReferralResponse(code, shareUrl, "Give $10, Get $10");
    }

    /** Record that someone used a referral code (reward pending until order is paid). */
    @Transactional
    public void recordReferral(String code, String referredEmail) {
        Customer referrer = customerRepository.findByReferralCode(code)
                .orElseThrow(() -> ApiException.badRequest("Unknown referral code"));
        Referral referral = new Referral();
        referral.setReferrerCustomerId(referrer.getId());
        referral.setReferredEmail(referredEmail);
        referral.setCode(code);
        referral.setRewardStatus("pending");
        referralRepository.save(referral);
    }

    private String uniqueCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder sb = new StringBuilder("PC");
            for (int i = 0; i < 6; i++) {
                sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
            }
            String code = sb.toString();
            if (!customerRepository.existsByReferralCode(code) && !promotionCodeRepository.existsById(code)) {
                return code;
            }
        }
        throw ApiException.conflict("Could not generate a unique referral code");
    }
}

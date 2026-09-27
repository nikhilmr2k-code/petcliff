package com.petcliff.controller;

import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Lightweight tax ESTIMATE for cart display, keyed by ZIP prefix. This is only an
 * approximation to show the shopper a number in the cart; the authoritative US
 * state/local tax is computed by Stripe Tax (automatic_tax) at checkout based on the
 * verified shipping address. Response is {state, rate} to match the frontend.
 */
@RestController
@RequestMapping("/api/tax")
public class TaxController {

    // Representative state + combined rate by leading ZIP digit (estimate only).
    private static final Map<Character, String[]> BY_LEAD = Map.of(
            '0', new String[]{"MA", "0.0625"},
            '1', new String[]{"NY", "0.08875"},
            '2', new String[]{"VA", "0.053"},
            '3', new String[]{"FL", "0.07"},
            '4', new String[]{"OH", "0.0725"},
            '6', new String[]{"IL", "0.1025"},
            '7', new String[]{"TX", "0.0825"},
            '8', new String[]{"CO", "0.0765"},
            '9', new String[]{"CA", "0.0975"}
    );

    @GetMapping("/quote")
    public Map<String, Object> quote(@RequestParam String zip) {
        Map<String, Object> out = new LinkedHashMap<>();
        if (zip == null || !zip.matches("\\d{5}")) {
            out.put("state", null);
            out.put("rate", 0.0);
            out.put("estimate", true);
            return out;
        }
        String[] hit = BY_LEAD.getOrDefault(zip.charAt(0), new String[]{"US", "0.0"});
        out.put("state", hit[0]);
        out.put("rate", Double.parseDouble(hit[1]));
        out.put("estimate", true);
        return out;
    }
}

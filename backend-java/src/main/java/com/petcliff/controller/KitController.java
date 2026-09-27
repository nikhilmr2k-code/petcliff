package com.petcliff.controller;

import com.petcliff.dto.KitQuoteResponse;
import com.petcliff.dto.KitRequest;
import com.petcliff.service.KitService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/kit")
public class KitController {

    private final KitService kitService;

    public KitController(KitService kitService) {
        this.kitService = kitService;
    }

    @PostMapping("/quote")
    public KitQuoteResponse quote(@Valid @RequestBody KitRequest request) {
        return kitService.quote(request);
    }
}

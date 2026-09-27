package com.petcliff.service;

import com.petcliff.dto.AuthResponse;
import com.petcliff.dto.LoginRequest;
import com.petcliff.dto.RegisterRequest;
import com.petcliff.entity.Customer;
import com.petcliff.exception.ApiException;
import com.petcliff.repository.CustomerRepository;
import com.petcliff.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(CustomerRepository customerRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (customerRepository.existsByEmail(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        Customer customer = new Customer();
        customer.setEmail(email);
        customer.setPasswordHash(passwordEncoder.encode(req.password()));
        customer.setFirstName(req.firstName());
        customer.setLastName(req.lastName());
        customer = customerRepository.save(customer);
        return toAuthResponse(customer);
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        if (customer.getPasswordHash() == null
                || !passwordEncoder.matches(req.password(), customer.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        return toAuthResponse(customer);
    }

    private AuthResponse toAuthResponse(Customer c) {
        String access = jwtService.createAccessToken(c.getId(), c.getEmail(), c.isAdmin());
        String refresh = jwtService.createRefreshToken(c.getId());
        return new AuthResponse(c.getId(), c.getEmail(), c.getFirstName(), c.getLastName(),
                c.isAdmin(), access, refresh);
    }
}

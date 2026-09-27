package com.petcliff.service;

import com.petcliff.dto.ResetPasswordRequest;
import com.petcliff.entity.Customer;
import com.petcliff.entity.PasswordResetToken;
import com.petcliff.exception.ApiException;
import com.petcliff.repository.CustomerRepository;
import com.petcliff.repository.PasswordResetTokenRepository;
import com.petcliff.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PasswordResetServiceTest {

    // Only interface mocks (Mockito uses JDK proxies for these — no ByteBuddy needed on Java 26).
    // resetPassword() never touches JwtService/EmailService, so null is safe and avoids mocking concrete classes.
    private final CustomerRepository customers = mock(CustomerRepository.class);
    private final PasswordResetTokenRepository tokens = mock(PasswordResetTokenRepository.class);
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();
    private final AuthService auth = new AuthService(customers, encoder, null, tokens, null, "https://www.petcliff.com");

    private PasswordResetToken tokenRow(String raw, boolean used, OffsetDateTime expires, UUID customerId) {
        PasswordResetToken t = new PasswordResetToken();
        t.setCustomerId(customerId);
        t.setTokenHash(AuthService.sha256(raw));
        t.setUsed(used);
        t.setExpiresAt(expires);
        return t;
    }

    @Test
    void resetPassword_happyPath_setsNewHashAndMarksUsed() {
        String raw = "valid-token";
        UUID cid = UUID.randomUUID();
        when(tokens.findByTokenHash(AuthService.sha256(raw)))
                .thenReturn(Optional.of(tokenRow(raw, false, OffsetDateTime.now().plusMinutes(30), cid)));
        Customer c = new Customer();
        c.setId(cid);
        c.setPasswordHash(encoder.encode("old"));
        when(customers.findById(cid)).thenReturn(Optional.of(c));

        auth.resetPassword(new ResetPasswordRequest(raw, "newpassword123"));

        assertTrue(encoder.matches("newpassword123", c.getPasswordHash()));
        verify(customers).save(c);
        verify(tokens).save(argThat(PasswordResetToken::isUsed));
    }

    @Test
    void resetPassword_expiredToken_rejected() {
        String raw = "expired-token";
        when(tokens.findByTokenHash(AuthService.sha256(raw)))
                .thenReturn(Optional.of(tokenRow(raw, false, OffsetDateTime.now().minusMinutes(1), UUID.randomUUID())));
        assertThrows(ApiException.class,
                () -> auth.resetPassword(new ResetPasswordRequest(raw, "newpassword123")));
        verify(customers, never()).save(any());
    }

    @Test
    void resetPassword_usedToken_rejected() {
        String raw = "used-token";
        when(tokens.findByTokenHash(AuthService.sha256(raw)))
                .thenReturn(Optional.of(tokenRow(raw, true, OffsetDateTime.now().plusMinutes(30), UUID.randomUUID())));
        assertThrows(ApiException.class,
                () -> auth.resetPassword(new ResetPasswordRequest(raw, "newpassword123")));
    }

    @Test
    void resetPassword_unknownToken_rejected() {
        when(tokens.findByTokenHash(any())).thenReturn(Optional.empty());
        assertThrows(ApiException.class,
                () -> auth.resetPassword(new ResetPasswordRequest("nope", "newpassword123")));
    }
}

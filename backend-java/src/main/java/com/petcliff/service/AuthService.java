package com.petcliff.service;

import com.petcliff.config.PetCliffProperties;
import com.petcliff.dto.AuthResponse;
import com.petcliff.dto.ChangePasswordRequest;
import com.petcliff.dto.ForgotPasswordRequest;
import com.petcliff.dto.LoginRequest;
import com.petcliff.dto.RegisterRequest;
import com.petcliff.dto.ResetPasswordRequest;
import com.petcliff.entity.Customer;
import com.petcliff.entity.PasswordResetToken;
import com.petcliff.exception.ApiException;
import com.petcliff.repository.CustomerRepository;
import com.petcliff.repository.PasswordResetTokenRepository;
import com.petcliff.security.CurrentUser;
import com.petcliff.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final EmailService emailService;
    private final String frontendUrl;

    public AuthService(CustomerRepository customerRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       PasswordResetTokenRepository resetTokenRepository,
                       EmailService emailService,
                       PetCliffProperties props) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.resetTokenRepository = resetTokenRepository;
        this.emailService = emailService;
        this.frontendUrl = props.getFrontendUrl();
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

        // Send welcome email — failures are swallowed in EmailService (never 500 the request).
        sendWelcomeEmail(customer);

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

    /** Change the password of the currently authenticated user. */
    @Transactional
    public void changePassword(ChangePasswordRequest req) {
        UUID id = CurrentUser.id();
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> ApiException.unauthorized("Authentication required"));
        if (customer.getPasswordHash() == null
                || !passwordEncoder.matches(req.currentPassword(), customer.getPasswordHash())) {
            throw ApiException.badRequest("Current password is incorrect");
        }
        customer.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        customerRepository.save(customer);
    }

    /** Issue a reset token and email a link. Always succeeds (anti-enumeration). */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest req) {
        String email = req.email().trim().toLowerCase();
        Optional<Customer> found = customerRepository.findByEmail(email);
        if (found.isEmpty()) {
            return; // do not reveal whether the account exists
        }
        Customer customer = found.get();
        byte[] raw = new byte[32];
        RANDOM.nextBytes(raw);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);

        PasswordResetToken prt = new PasswordResetToken();
        prt.setCustomerId(customer.getId());
        prt.setTokenHash(sha256(rawToken));
        prt.setExpiresAt(OffsetDateTime.now().plusHours(1));
        resetTokenRepository.save(prt);

        String link = frontendUrl + "/reset-password?token=" + rawToken;
        String text = "Reset your Pet Cliff password using this link (valid 1 hour):\n\n" + link
                + "\n\nIf you didn't request this, you can ignore this email.";
        String html = "<p>Reset your Pet Cliff password using the link below (valid 1 hour):</p>"
                + "<p><a href=\"" + link + "\">Reset password</a></p>"
                + "<p style=\"color:#646464;font-size:12px\">If you didn't request this, you can ignore this email.</p>";
        emailService.send(customer.getEmail(), "Reset your Pet Cliff password", html, text);
    }

    /** Consume a reset token and set a new password. */
    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        PasswordResetToken prt = resetTokenRepository.findByTokenHash(sha256(req.token()))
                .orElseThrow(() -> ApiException.badRequest("Invalid or expired reset link"));
        if (prt.isUsed() || prt.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw ApiException.badRequest("Invalid or expired reset link");
        }
        Customer customer = customerRepository.findById(prt.getCustomerId())
                .orElseThrow(() -> ApiException.badRequest("Invalid or expired reset link"));
        customer.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        customerRepository.save(customer);
        prt.setUsed(true);
        resetTokenRepository.save(prt);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private void sendWelcomeEmail(Customer customer) {
        String firstName = customer.getFirstName() != null ? customer.getFirstName() : "there";
        String shopUrl = frontendUrl + "/shop";
        String text = "Hi " + firstName + ",\n\n"
                + "Welcome to Pet Cliff! Your account has been created.\n\n"
                + "Start shopping: " + shopUrl + "\n\n"
                + "— The Pet Cliff Team";
        String html = "<div style=\"font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a\">"
                + "<h2 style=\"font-size:22px;font-weight:900;letter-spacing:-0.5px;margin-bottom:8px\">"
                + "Welcome to Pet Cliff, " + firstName + "!</h2>"
                + "<p style=\"color:#444;font-size:14px;line-height:1.6\">"
                + "Your account is all set. Browse our collection of premium pet products and build "
                + "your pet's perfect kit.</p>"
                + "<p style=\"margin-top:24px\">"
                + "<a href=\"" + shopUrl + "\" "
                + "style=\"display:inline-block;background:#1a1a1a;color:#fff;padding:12px 28px;"
                + "font-size:12px;font-family:monospace;letter-spacing:0.15em;text-transform:uppercase;"
                + "text-decoration:none\">Shop Now</a></p>"
                + "<p style=\"margin-top:32px;font-size:11px;color:#888\">"
                + "You're receiving this because you created an account at petcliff.com.</p>"
                + "</div>";
        emailService.send(customer.getEmail(), "Welcome to Pet Cliff 🐾", html, text);
    }

    static String sha256(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}

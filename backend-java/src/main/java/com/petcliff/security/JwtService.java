package com.petcliff.security;

import com.petcliff.config.PetCliffProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessTtlMs;
    private final long refreshTtlMs;

    public JwtService(PetCliffProperties props) {
        this.key = Keys.hmacShaKeyFor(props.getJwt().getSecret().getBytes(StandardCharsets.UTF_8));
        this.accessTtlMs = props.getJwt().getAccessTokenTtlMinutes() * 60_000L;
        this.refreshTtlMs = props.getJwt().getRefreshTokenTtlDays() * 24L * 60L * 60_000L;
    }

    public String createAccessToken(UUID customerId, String email, boolean admin) {
        return build(customerId, Map.of("email", email, "admin", admin, "type", "access"), accessTtlMs);
    }

    public String createRefreshToken(UUID customerId) {
        return build(customerId, Map.of("type", "refresh"), refreshTtlMs);
    }

    private String build(UUID subject, Map<String, Object> claims, long ttlMs) {
        Date now = new Date();
        return Jwts.builder()
                .subject(subject.toString())
                .claims(claims)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + ttlMs))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}

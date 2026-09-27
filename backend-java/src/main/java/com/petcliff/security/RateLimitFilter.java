package com.petcliff.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Lightweight in-memory per-IP rate limiter for sensitive auth endpoints (brute-force slowdown).
 * Fixed 60-second window; configurable via RATE_LIMIT_PER_MIN (default 10). Product browsing is
 * unaffected. Uses X-Forwarded-For (set by CloudFront/EB) for the client IP.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> LIMITED = Set.of(
            "/api/auth/login",
            "/api/auth/forgot-password",
            "/api/auth/reset-password"
    );

    private final int perMinute;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimitFilter(@Value("${RATE_LIMIT_PER_MIN:10}") int perMinute) {
        this.perMinute = perMinute;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        if (!"POST".equalsIgnoreCase(request.getMethod()) || !LIMITED.contains(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }
        String key = request.getRequestURI() + "|" + clientIp(request);
        long now = System.currentTimeMillis();
        Window w = windows.compute(key, (k, cur) -> {
            if (cur == null || now - cur.start >= 60_000L) return new Window(now);
            return cur;
        });
        if (w.count.incrementAndGet() > perMinute) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Too many attempts. Please try again in a minute.\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }

    private static final class Window {
        final long start;
        final AtomicInteger count = new AtomicInteger(0);
        Window(long start) { this.start = start; }
    }
}

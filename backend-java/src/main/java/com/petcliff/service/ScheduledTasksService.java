package com.petcliff.service;

import com.petcliff.repository.PasswordResetTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

/**
 * Periodic maintenance tasks.
 *
 * <p>Token cleanup runs every 6 hours and removes password_reset_tokens that are
 * either expired or already used. This keeps the table small and the index tight
 * without any manual DBA intervention.
 */
@Service
public class ScheduledTasksService {

    private static final Logger log = LoggerFactory.getLogger(ScheduledTasksService.class);

    private final PasswordResetTokenRepository resetTokenRepository;

    public ScheduledTasksService(PasswordResetTokenRepository resetTokenRepository) {
        this.resetTokenRepository = resetTokenRepository;
    }

    /**
     * Delete expired and used password reset tokens.
     * Runs every 6 hours (fixedRate = 6 * 60 * 60 * 1000 ms).
     * initialDelay of 5 minutes avoids firing during startup.
     */
    @Scheduled(fixedRateString = "PT6H", initialDelayString = "PT5M")
    @Transactional
    public void purgeStalePasswordResetTokens() {
        int deleted = resetTokenRepository.deleteExpiredOrUsed(OffsetDateTime.now());
        if (deleted > 0) {
            log.info("Token cleanup: deleted {} expired/used password_reset_tokens", deleted);
        }
    }
}

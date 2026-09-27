package com.petcliff.repository;

import com.petcliff.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /** Bulk-delete tokens that are expired or already used. Used by the cleanup job. */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.used = true OR t.expiresAt < :now")
    int deleteExpiredOrUsed(@Param("now") OffsetDateTime now);
}

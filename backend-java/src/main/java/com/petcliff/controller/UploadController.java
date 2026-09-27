package com.petcliff.controller;

import com.petcliff.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

/**
 * Admin image upload -> S3 (served via the media CloudFront distribution).
 * Guarded by SecurityConfig (/api/admin/** requires ADMIN). Uses the default
 * credentials provider chain (EC2 instance role in prod) — no hardcoded keys.
 */
@RestController
@RequestMapping("/api/admin")
public class UploadController {

    private final String bucket;
    private final String cdn;
    private final String region;
    private volatile S3Client s3;

    public UploadController(@Value("${petcliff.media.bucket:}") String bucket,
                            @Value("${petcliff.media.cdn:}") String cdn,
                            @Value("${petcliff.media.region:us-west-2}") String region) {
        this.bucket = bucket;
        this.cdn = cdn;
        this.region = region;
    }

    private S3Client s3() {
        if (s3 == null) {
            synchronized (this) {
                if (s3 == null) {
                    s3 = S3Client.builder().region(Region.of(region)).build();
                }
            }
        }
        return s3;
    }

    @PostMapping("/upload")
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) {
        if (bucket == null || bucket.isBlank() || cdn == null || cdn.isBlank()) {
            throw ApiException.badRequest("Media storage is not configured (MEDIA_BUCKET/MEDIA_CDN).");
        }
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("No file provided.");
        }
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.') + 1).toLowerCase() : "bin";
        String key = "products/" + UUID.randomUUID() + "." + ext;
        try {
            PutObjectRequest req = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                    .build();
            s3().putObject(req, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException e) {
            throw ApiException.badRequest("Upload failed: " + e.getMessage());
        }
        return Map.of("url", "https://" + cdn + "/" + key);
    }
}

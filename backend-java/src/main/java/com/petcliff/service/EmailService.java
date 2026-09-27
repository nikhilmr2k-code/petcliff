package com.petcliff.service;

import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.*;

/**
 * Sends transactional email via AWS SES v2 using the default credential chain (EC2 instance role).
 * If SES is unconfigured or send fails, the message is logged (WARN) and the error is swallowed,
 * so local/dev and sandbox environments never 500 on a password-reset request.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final String from;
    private final String region;
    private volatile SesV2Client client;

    public EmailService(@Value("${MAIL_FROM:noreply@petcliff.com}") String from,
                        @Value("${AWS_REGION:us-west-2}") String region) {
        this.from = from;
        this.region = region;
    }

    private SesV2Client client() {
        if (client == null) {
            synchronized (this) {
                if (client == null) {
                    client = SesV2Client.builder().region(Region.of(region)).build();
                }
            }
        }
        return client;
    }

    public void send(String to, String subject, String htmlBody, String textBody) {
        try {
            SendEmailRequest req = SendEmailRequest.builder()
                    .fromEmailAddress(from)
                    .destination(Destination.builder().toAddresses(to).build())
                    .content(EmailContent.builder().simple(Message.builder()
                            .subject(Content.builder().data(subject).build())
                            .body(Body.builder()
                                    .html(Content.builder().data(htmlBody).build())
                                    .text(Content.builder().data(textBody).build())
                                    .build())
                            .build()).build())
                    .build();
            client().sendEmail(req);
            log.info("Sent email to {} (subject: {})", to, subject);
        } catch (Exception e) {
            log.warn("Email send failed to {} (subject: {}). Body(text): {} | error: {}",
                    to, subject, textBody, e.getMessage());
        }
    }

    @PreDestroy
    void close() {
        if (client != null) client.close();
    }
}

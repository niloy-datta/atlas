package com.atlas.identity.infrastructure;

import com.atlas.identity.application.PasswordRecoveryMailer;
import com.atlas.identity.config.AuthProperties;
import java.time.Instant;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class SmtpPasswordRecoveryMailer implements PasswordRecoveryMailer {
    private final JavaMailSender mailSender;
    private final AuthProperties properties;

    public SmtpPasswordRecoveryMailer(JavaMailSender mailSender, AuthProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    @Override
    public void sendPasswordReset(String email, String rawToken, Instant expiresAt) {
        String link = UriComponentsBuilder.fromUriString(properties.passwordResetUrl())
                .queryParam("token", rawToken)
                .build()
                .toUriString();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("no-reply@atlas.local");
        message.setTo(email);
        message.setSubject("Reset your ATLAS password");
        message.setText("Use this one-time link before " + expiresAt + ":\n" + link);
        mailSender.send(message);
    }
}

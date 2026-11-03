package com.mercotrace.otp;

import com.mercotrace.model.User;
import com.mercotrace.repo.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.time.Instant;

@Service
public class OtpService {
    private final OtpTokenRepository tokens;
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final SmsSender sms;
    private final long expiryMinutes;
    private final int maxAttempts;
    private final long resendSeconds;
    private final SecureRandom random = new SecureRandom();

    public OtpService(OtpTokenRepository tokens, UserRepository users, PasswordEncoder encoder, SmsSender sms,
                      @Value("${app.otp.expiry-minutes}") long expiryMinutes,
                      @Value("${app.otp.max-attempts}") int maxAttempts,
                      @Value("${app.otp.resend-seconds}") long resendSeconds) {
        this.tokens = tokens; this.users = users; this.encoder = encoder; this.sms = sms;
        this.expiryMinutes = expiryMinutes; this.maxAttempts = maxAttempts; this.resendSeconds = resendSeconds;
    }

    /** Silently does nothing for unknown numbers so the response never reveals who is registered. */
    @Transactional
    public void send(String mobile) {
        if (users.findByMobile(mobile).filter(User::isActive).isEmpty()) return;

        tokens.findTopByMobileOrderByIdDesc(mobile).ifPresent(last -> {
            if (last.getCreatedAt().plusSeconds(resendSeconds).isAfter(Instant.now()))
                throw new IllegalArgumentException("Please wait " + resendSeconds + " seconds before requesting another code");
        });

        tokens.deleteByMobile(mobile);
        String code = String.format("%06d", random.nextInt(1_000_000));

        OtpToken t = new OtpToken();
        t.setMobile(mobile);
        t.setCodeHash(encoder.encode(code));
        t.setExpiresAt(Instant.now().plusSeconds(expiryMinutes * 60));
        tokens.save(t);

        sms.sendOtp(mobile, code);
    }

    // noRollbackFor: the failed-attempt counter must still be saved when we throw
    @Transactional(noRollbackFor = BadCredentialsException.class)
    public User verify(String mobile, String code) {
        OtpToken t = tokens.findTopByMobileOrderByIdDesc(mobile)
                .filter(x -> !x.isConsumed() && x.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired code"));

        if (t.getAttempts() >= maxAttempts)
            throw new BadCredentialsException("Too many wrong attempts. Request a new code");

        if (!encoder.matches(code, t.getCodeHash())) {
            t.setAttempts(t.getAttempts() + 1);
            tokens.save(t);
            throw new BadCredentialsException("Invalid or expired code");
        }

        t.setConsumed(true);
        tokens.save(t);
        return users.findByMobile(mobile).filter(User::isActive)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired code"));
    }
}
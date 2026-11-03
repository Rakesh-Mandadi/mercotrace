package com.mercotrace.web;

import com.mercotrace.dto.Dtos.*;
import com.mercotrace.model.User;
import com.mercotrace.otp.OtpService;
import com.mercotrace.repo.UserRepository;
import com.mercotrace.security.JwtService;
import io.jsonwebtoken.JwtException;
import jakarta.validation.Valid;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final OtpService otp;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt, OtpService otp) {
        this.users = users; this.encoder = encoder; this.jwt = jwt; this.otp = otp;
    }

    /** Email + password. (Mobile numbers sign in with an OTP instead.) */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        User user = users.findByEmailIgnoreCase(req.identifier().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (!user.isActive() || !encoder.matches(req.password(), user.getPasswordHash()))
            throw new BadCredentialsException("Invalid credentials");
        return respond(user);
    }

    @PostMapping("/otp/send")
    public Map<String, String> sendOtp(@Valid @RequestBody OtpSendRequest req) {
        otp.send(req.mobile().trim());
        return Map.of("message", "If this number is registered, a code has been sent");
    }

    @PostMapping("/otp/verify")
    public AuthResponse verifyOtp(@Valid @RequestBody OtpVerifyRequest req) {
        return respond(otp.verify(req.mobile().trim(), req.otp().trim()));
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest req) {
        try {
            var claims = jwt.parse(req.refreshToken());
            if (!"refresh".equals(claims.get("type", String.class))) throw new BadCredentialsException("Invalid token");
            User user = users.findById(Long.valueOf(claims.getSubject()))
                    .filter(User::isActive)
                    .orElseThrow(() -> new BadCredentialsException("Invalid token"));
            return respond(user);
        } catch (JwtException e) {
            throw new BadCredentialsException("Session expired");
        }
    }

    private AuthResponse respond(User u) {
        return new AuthResponse(jwt.accessToken(u), jwt.refreshToken(u), ProfileController.toDto(u));
    }
}
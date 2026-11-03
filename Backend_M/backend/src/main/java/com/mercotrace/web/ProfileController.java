package com.mercotrace.web;

import com.mercotrace.dto.Dtos.*;
import com.mercotrace.model.User;
import com.mercotrace.repo.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final UserRepository users;
    private final PasswordEncoder encoder;

    public ProfileController(UserRepository users, PasswordEncoder encoder) {
        this.users = users; this.encoder = encoder;
    }

    static ProfileDto toDto(User u) {
        return new ProfileDto(u.getId(), u.getUsername(), u.getEmail(), u.getMobile(),
                u.getFullName(), u.getAddress(), u.getRole());
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }

    @GetMapping
    public ProfileDto get(@AuthenticationPrincipal Long userId) {
        return toDto(users.findById(userId).orElseThrow());
    }

    @PutMapping
    public ProfileDto update(@AuthenticationPrincipal Long userId, @Valid @RequestBody ProfileUpdate req) {
        User u = users.findById(userId).orElseThrow();
        String username = req.username().trim();
        String email = blankToNull(req.email());
        String mobile = blankToNull(req.mobile());

        if (email == null && mobile == null)
            throw new IllegalArgumentException("Keep at least one of email or mobile so you can sign in");

        users.findByUsernameIgnoreCase(username).filter(o -> !o.getId().equals(userId))
                .ifPresent(o -> { throw new IllegalArgumentException("Username is already taken"); });
        if (email != null) users.findByEmailIgnoreCase(email).filter(o -> !o.getId().equals(userId))
                .ifPresent(o -> { throw new IllegalArgumentException("Email is already in use"); });
        if (mobile != null) users.findByMobile(mobile).filter(o -> !o.getId().equals(userId))
                .ifPresent(o -> { throw new IllegalArgumentException("Mobile number is already in use"); });

        u.setUsername(username);
        u.setEmail(email == null ? null : email.toLowerCase());
        u.setMobile(mobile);
        u.setFullName(blankToNull(req.fullName()));
        u.setAddress(blankToNull(req.address()));
        return toDto(users.save(u));
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(@AuthenticationPrincipal Long userId,
                                                              @Valid @RequestBody PasswordChange req) {
        User u = users.findById(userId).orElseThrow();
        if (!encoder.matches(req.currentPassword(), u.getPasswordHash()))
            throw new IllegalArgumentException("Current password is incorrect");
        u.setPasswordHash(encoder.encode(req.newPassword()));
        users.save(u);
        return ResponseEntity.ok(Map.of("message", "Password updated"));
    }
}

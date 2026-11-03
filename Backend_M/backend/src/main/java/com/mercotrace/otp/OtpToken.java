package com.mercotrace.otp;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "otp_tokens", indexes = @Index(columnList = "mobile"))
@Getter @Setter
public class OtpToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 15)
    private String mobile;

    @Column(nullable = false)
    private String codeHash;

    private Instant createdAt = Instant.now();
    private Instant expiresAt;
    private int attempts;
    private boolean consumed;
}
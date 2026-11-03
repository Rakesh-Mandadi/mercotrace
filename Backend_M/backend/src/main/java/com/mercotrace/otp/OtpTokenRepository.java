package com.mercotrace.otp;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findTopByMobileOrderByIdDesc(String mobile);
    void deleteByMobile(String mobile);
}
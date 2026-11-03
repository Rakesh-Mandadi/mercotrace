package com.mercotrace.otp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Development sender: prints the code in the console instead of sending an SMS. */
@Component
public class LogSmsSender implements SmsSender {
    private static final Logger log = LoggerFactory.getLogger(LogSmsSender.class);

    @Override
    public void sendOtp(String mobile, String code) {
        log.info("=== OTP for {} is {} ===", mobile, code);
    }
}
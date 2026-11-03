package com.mercotrace.otp;

/** Swap the implementation for a real SMS provider (MSG91, Twilio, ...) without touching anything else. */
public interface SmsSender {
    void sendOtp(String mobile, String code);
}
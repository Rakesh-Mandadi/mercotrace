package com.mercotrace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public final class Dtos {
    private Dtos() {}

    public record LoginRequest(@NotBlank(message = "Enter your email address") String identifier,
            @NotBlank(message = "Enter your password") String password) {}
public record OtpSendRequest(@NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit mobile number") String mobile) {}
public record OtpVerifyRequest(@NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit mobile number") String mobile,
                @NotBlank @Pattern(regexp = "^\\d{6}$", message = "Enter the 6-digit code") String otp) {}
    public record RefreshRequest(@NotBlank String refreshToken) {}
    public record AuthResponse(String accessToken, String refreshToken, ProfileDto user) {}

    public record ProfileDto(Long id, String username, String email, String mobile,
                             String fullName, String address, String role) {}
    public record ProfileUpdate(@NotBlank(message = "Username is required") @Size(max = 100) String username,
                                String email, String mobile, String fullName, String address) {}
    public record PasswordChange(@NotBlank(message = "Enter your current password") String currentPassword,
                                 @NotBlank @Size(min = 8, message = "New password must be at least 8 characters") String newPassword) {}

    public record DeductionRuleDto(BigDecimal minKg, BigDecimal maxKg, BigDecimal deductKg) {}
    public record RoundBandDto(BigDecimal fromDecimal, BigDecimal toDecimal, BigDecimal target) {}

    public record CommodityDto(Long id,
                               @NotBlank(message = "Commodity name is required") String name,
                               BigDecimal unitKg, BigDecimal minWeight, BigDecimal maxWeight,
                               BigDecimal commissionPercent, BigDecimal userFeePercent,
                               boolean gstApplicable, String hsnCode, String gstType,
                               BigDecimal gstPercent, BigDecimal sgstPercent, BigDecimal cgstPercent,
                               String prefix, boolean deductionEnabled, boolean roundOffEnabled,
                               List<DeductionRuleDto> deductionRules, List<RoundBandDto> roundBands,
                               boolean coolieEnabled, BigDecimal coolieRatePerKg,
                               boolean hamaliEnabled, BigDecimal weighingCharge) {}

    public record DashboardDto(long commodities, long withHsn, long deductionEnabled, long hamaliEnabled) {}
}

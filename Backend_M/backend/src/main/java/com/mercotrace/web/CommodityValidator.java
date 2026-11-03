package com.mercotrace.web;

import com.mercotrace.dto.Dtos.*;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

/** Server-side rules; mirrors shared/commodity.js so web and mobile get the same checks. */
final class CommodityValidator {
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal STEP = new BigDecimal("0.01");

    private CommodityValidator() {}

    private static void check(boolean ok, String msg) { if (!ok) throw new IllegalArgumentException(msg); }
    private static boolean between(BigDecimal v, BigDecimal lo, BigDecimal hi) {
        return v.compareTo(lo) >= 0 && v.compareTo(hi) <= 0;
    }

    static void validate(CommodityDto d) {
        check(d.unitKg() != null && d.unitKg().signum() > 0, "Rate per unit (kg) must be greater than 0");
        if (d.minWeight() != null && d.maxWeight() != null)
            check(d.minWeight().compareTo(d.maxWeight()) <= 0, "Minimum weight cannot be above maximum weight");
        if (d.commissionPercent() != null)
            check(between(d.commissionPercent(), BigDecimal.ZERO, HUNDRED), "Commission % must be between 0 and 100");
        if (d.userFeePercent() != null)
            check(between(d.userFeePercent(), BigDecimal.ZERO, HUNDRED), "User fee % must be between 0 and 100");

        if (d.gstApplicable()) {
            check(d.hsnCode() != null && d.hsnCode().trim().matches("\\d{6}|\\d{8}"),
                    "HSN must be 6 digits (goods) or SAC 8 digits (services)");
            check("GST".equals(d.gstType()) || "IGST".equals(d.gstType()), "Choose GST or IGST");
            check(d.gstPercent() != null && between(d.gstPercent(), BigDecimal.ZERO, HUNDRED),
                    "GST % is required (0 to 100)");
            if ("GST".equals(d.gstType()) && (d.sgstPercent() != null || d.cgstPercent() != null)) {
                check(d.sgstPercent() != null && d.cgstPercent() != null
                        && d.sgstPercent().add(d.cgstPercent()).compareTo(d.gstPercent()) == 0,
                        "SGST + CGST must add up to the GST %");
            }
        }
        if (d.deductionEnabled()) deduction(d.deductionRules());
        if (d.roundOffEnabled()) bands(d.roundBands());
    }

    private static void deduction(List<DeductionRuleDto> rules) {
        check(rules != null && !rules.isEmpty(), "Add at least one deduction rule or turn deduction off");
        for (var r : rules) {
            check(r.minKg() != null && r.maxKg() != null && r.deductKg() != null,
                    "Fill Min kg, Max kg and Deduct kg in every deduction rule");
            check(r.minKg().compareTo(r.maxKg()) <= 0, "In a deduction rule, Min kg cannot be above Max kg");
            check(r.deductKg().signum() >= 0, "Deduct kg cannot be negative");
        }
        var sorted = rules.stream().sorted(Comparator.comparing(DeductionRuleDto::minKg)).toList();
        for (int i = 1; i < sorted.size(); i++)
            check(sorted.get(i).minKg().compareTo(sorted.get(i - 1).maxKg()) > 0, "Deduction ranges must not overlap");
    }

    private static void bands(List<RoundBandDto> bands) {
        check(bands != null && !bands.isEmpty(), "Add round-off bands covering 0 to 1");
        for (var b : bands) {
            check(b.fromDecimal() != null && b.toDecimal() != null && b.target() != null,
                    "Fill every field in the round-off bands");
            check(between(b.fromDecimal(), BigDecimal.ZERO, BigDecimal.ONE)
                    && between(b.toDecimal(), BigDecimal.ZERO, BigDecimal.ONE), "Round-off bands must stay between 0 and 1");
            check(b.fromDecimal().compareTo(b.toDecimal()) <= 0, "In a band, From cannot be above To");
            check(between(b.target(), BigDecimal.ZERO, BigDecimal.ONE), "Round-off target must be between 0 and 1");
        }
        var s = bands.stream().sorted(Comparator.comparing(RoundBandDto::fromDecimal)).toList();
        check(s.get(0).fromDecimal().signum() == 0, "Round-off bands must start at 0");
        check(s.get(s.size() - 1).toDecimal().compareTo(BigDecimal.ONE) == 0, "Round-off bands must end at 1");
        for (int i = 1; i < s.size(); i++)
            check(s.get(i - 1).toDecimal().add(STEP).compareTo(s.get(i).fromDecimal()) == 0,
                    "Round-off bands must cover 0 to 1 with no gaps or overlaps (next band starts 0.01 after the previous)");
    }
}

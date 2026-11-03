package com.mercotrace.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "commodities")
@Getter @Setter
public class Commodity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String name;

    // Rate per unit (kg): the denominator in Final Price = (Weight / unitKg) x Rate
    @Column(precision = 10, scale = 2)
    private BigDecimal unitKg;

    // Weight alarm range (outlier alert only, never blocks)
    @Column(precision = 10, scale = 2)
    private BigDecimal minWeight;
    @Column(precision = 10, scale = 2)
    private BigDecimal maxWeight;

    @Column(precision = 5, scale = 2)
    private BigDecimal commissionPercent = BigDecimal.ZERO;
    @Column(precision = 5, scale = 2)
    private BigDecimal userFeePercent = BigDecimal.ZERO;

    // GST
    private boolean gstApplicable;
    private String hsnCode;                 // 6 digits (HSN) or 8 digits (SAC)
    private String gstType;                 // "GST" or "IGST"
    @Column(precision = 5, scale = 2)
    private BigDecimal gstPercent;
    @Column(precision = 5, scale = 2)
    private BigDecimal sgstPercent;
    @Column(precision = 5, scale = 2)
    private BigDecimal cgstPercent;

    private String prefix;                  // bill prefix

    // Calculation type
    private boolean deductionEnabled;
    private boolean roundOffEnabled;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "commodity_deduction_rules", joinColumns = @JoinColumn(name = "commodity_id"))
    @OrderColumn(name = "sort_order")
    private List<DeductionRule> deductionRules = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "commodity_round_bands", joinColumns = @JoinColumn(name = "commodity_id"))
    @OrderColumn(name = "sort_order")
    private List<RoundBand> roundBands = new ArrayList<>();

    // Other charges
    private boolean coolieEnabled;
    @Column(precision = 10, scale = 2)
    private BigDecimal coolieRatePerKg;
    private boolean hamaliEnabled;
    @Column(precision = 10, scale = 2)
    private BigDecimal weighingCharge;
}
package com.mercotrace.model;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Embeddable
@Getter @Setter
public class DeductionRule {
    private BigDecimal minKg;
    private BigDecimal maxKg;
    private BigDecimal deductKg;
}
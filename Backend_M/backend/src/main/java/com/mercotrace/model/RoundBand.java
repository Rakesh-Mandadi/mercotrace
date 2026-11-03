package com.mercotrace.model;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Embeddable
@Getter @Setter
public class RoundBand {
    private BigDecimal fromDecimal;   // 0.00 - 1.00
    private BigDecimal toDecimal;
    private BigDecimal target;        // 0 = lower whole kg, 0.5 = half kg, 1 = next whole kg
}

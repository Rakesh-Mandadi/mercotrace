package com.mercotrace.web;

import com.mercotrace.dto.Dtos.*;
import com.mercotrace.model.Commodity;
import com.mercotrace.model.DeductionRule;
import com.mercotrace.model.RoundBand;
import com.mercotrace.repo.CommodityRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/commodities")
public class CommodityController {
    private final CommodityRepository repo;
    public CommodityController(CommodityRepository repo) { this.repo = repo; }

    static CommodityDto toDto(Commodity c) {
        return new CommodityDto(c.getId(), c.getName(), c.getUnitKg(), c.getMinWeight(), c.getMaxWeight(),
                c.getCommissionPercent(), c.getUserFeePercent(),
                c.isGstApplicable(), c.getHsnCode(), c.getGstType(),
                c.getGstPercent(), c.getSgstPercent(), c.getCgstPercent(),
                c.getPrefix(), c.isDeductionEnabled(), c.isRoundOffEnabled(),
                c.getDeductionRules().stream()
                        .map(r -> new DeductionRuleDto(r.getMinKg(), r.getMaxKg(), r.getDeductKg())).toList(),
                c.getRoundBands().stream()
                        .map(b -> new RoundBandDto(b.getFromDecimal(), b.getToDecimal(), b.getTarget())).toList(),
                c.isCoolieEnabled(), c.getCoolieRatePerKg(), c.isHamaliEnabled(), c.getWeighingCharge());
    }

    private static String clean(String s) { return s == null || s.isBlank() ? null : s.trim(); }

    private void apply(Commodity c, CommodityDto d) {
        CommodityValidator.validate(d);
        c.setName(d.name().trim());
        c.setUnitKg(d.unitKg());
        c.setMinWeight(d.minWeight());
        c.setMaxWeight(d.maxWeight());
        c.setCommissionPercent(d.commissionPercent() == null ? java.math.BigDecimal.ZERO : d.commissionPercent());
        c.setUserFeePercent(d.userFeePercent() == null ? java.math.BigDecimal.ZERO : d.userFeePercent());

        boolean gst = d.gstApplicable();
        boolean igst = "IGST".equals(d.gstType());
        c.setGstApplicable(gst);
        c.setHsnCode(gst ? d.hsnCode().trim() : null);
        c.setGstType(gst ? d.gstType() : null);
        c.setGstPercent(gst ? d.gstPercent() : null);
        c.setSgstPercent(gst && !igst ? d.sgstPercent() : null);
        c.setCgstPercent(gst && !igst ? d.cgstPercent() : null);

        c.setPrefix(clean(d.prefix()));
        c.setDeductionEnabled(d.deductionEnabled());
        c.setRoundOffEnabled(d.roundOffEnabled());

        c.getDeductionRules().clear();
        if (d.deductionEnabled()) d.deductionRules().forEach(r -> {
            DeductionRule x = new DeductionRule();
            x.setMinKg(r.minKg()); x.setMaxKg(r.maxKg()); x.setDeductKg(r.deductKg());
            c.getDeductionRules().add(x);
        });
        c.getRoundBands().clear();
        if (d.roundOffEnabled()) d.roundBands().forEach(b -> {
            RoundBand x = new RoundBand();
            x.setFromDecimal(b.fromDecimal()); x.setToDecimal(b.toDecimal()); x.setTarget(b.target());
            c.getRoundBands().add(x);
        });

        c.setCoolieEnabled(d.coolieEnabled());
        c.setCoolieRatePerKg(d.coolieEnabled() ? d.coolieRatePerKg() : null);
        c.setHamaliEnabled(d.hamaliEnabled());
        c.setWeighingCharge(d.weighingCharge());
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<CommodityDto> list(@AuthenticationPrincipal Long userId) {
        return repo.findByUserIdOrderByIdAsc(userId).stream().map(CommodityController::toDto).toList();
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public CommodityDto create(@AuthenticationPrincipal Long userId, @Valid @RequestBody CommodityDto d) {
        Commodity c = new Commodity();
        c.setUserId(userId);
        apply(c, d);
        return toDto(repo.save(c));
    }

    @PutMapping("/{id}")
    @Transactional
    public CommodityDto update(@AuthenticationPrincipal Long userId, @PathVariable Long id,
                               @Valid @RequestBody CommodityDto d) {
        Commodity c = repo.findByIdAndUserId(id, userId).orElseThrow(NoSuchElementException::new);
        apply(c, d);
        return toDto(repo.save(c));
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        repo.delete(repo.findByIdAndUserId(id, userId).orElseThrow(NoSuchElementException::new));
    }
}

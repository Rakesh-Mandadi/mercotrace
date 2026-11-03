package com.mercotrace.web;

import com.mercotrace.dto.Dtos.DashboardDto;
import com.mercotrace.model.Commodity;
import com.mercotrace.repo.CommodityRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final CommodityRepository repo;
    public DashboardController(CommodityRepository repo) { this.repo = repo; }

    @GetMapping
    public DashboardDto stats(@AuthenticationPrincipal Long userId) {
        List<Commodity> all = repo.findByUserIdOrderByIdAsc(userId);
        return new DashboardDto(
                all.size(),
                all.stream().filter(c -> c.getHsnCode() != null).count(),
                all.stream().filter(Commodity::isDeductionEnabled).count(),
                all.stream().filter(Commodity::isHamaliEnabled).count());
    }
}

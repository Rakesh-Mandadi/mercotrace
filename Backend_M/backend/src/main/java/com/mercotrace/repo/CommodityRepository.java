package com.mercotrace.repo;

import com.mercotrace.model.Commodity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CommodityRepository extends JpaRepository<Commodity, Long> {
    List<Commodity> findByUserIdOrderByIdAsc(Long userId);
    Optional<Commodity> findByIdAndUserId(Long id, Long userId);
}

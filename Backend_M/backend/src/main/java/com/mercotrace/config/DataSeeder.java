package com.mercotrace.config;

import com.mercotrace.model.Commodity;
import com.mercotrace.model.User;
import com.mercotrace.repo.CommodityRepository;
import com.mercotrace.repo.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

/** Creates the seeded login (password stored as a BCrypt hash) plus a few sample commodities. */
@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final CommodityRepository commodities;
    private final PasswordEncoder encoder;
    private final String username, email, mobile, password;

    public DataSeeder(UserRepository users, CommodityRepository commodities, PasswordEncoder encoder,
                      @Value("${app.seed.username}") String username,
                      @Value("${app.seed.email}") String email,
                      @Value("${app.seed.mobile}") String mobile,
                      @Value("${app.seed.password}") String password) {
        this.users = users; this.commodities = commodities; this.encoder = encoder;
        this.username = username; this.email = email; this.mobile = mobile; this.password = password;
    }

    @Override
    public void run(String... args) {
        if (users.findByEmailIgnoreCase(email).isPresent()) return;

        User u = new User();
        u.setUsername(username);
        u.setEmail(email.toLowerCase());
        u.setMobile(mobile);
        u.setPasswordHash(encoder.encode(password));
        u.setFullName("DTC Trader");
        u = users.save(u);

        seed(u.getId(), "Chilli", null, null, null, false, false);
        seed(u.getId(), "Patato", null, null, null, false, false);
        seed(u.getId(), "Dry Chilli", new BigDecimal("50"), "09042110", "DC", true, true);
    
    }

	private void seed(Long userId, String name, BigDecimal unitKg, String hsn, String prefix, boolean deduction,
			boolean hamali) {
		Commodity c = new Commodity();
		c.setUserId(userId);
		c.setName(name);
		c.setUnitKg(unitKg);
		c.setPrefix(prefix);
		if (hsn != null) {
			c.setGstApplicable(true);
			c.setHsnCode(hsn);
			c.setGstType("GST");
			c.setGstPercent(new BigDecimal("5"));
			c.setSgstPercent(new BigDecimal("2.5"));
			c.setCgstPercent(new BigDecimal("2.5"));
		}
		c.setDeductionEnabled(deduction);
		if (deduction) {
			com.mercotrace.model.DeductionRule r = new com.mercotrace.model.DeductionRule();
			r.setMinKg(new BigDecimal("0"));
			r.setMaxKg(new BigDecimal("1000"));
			r.setDeductKg(new BigDecimal("1"));
			c.getDeductionRules().add(r);
		}
		c.setHamaliEnabled(hamali);
		commodities.save(c);
	}

}

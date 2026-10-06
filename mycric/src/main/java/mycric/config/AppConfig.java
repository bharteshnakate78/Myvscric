package mycric.config;

import mycric.entity.Role;
import mycric.entity.User;
import mycric.repository.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@EnableScheduling
public class AppConfig {

    @Bean
    public CommandLineRunner createDefaultAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {

            final String email = "bharteshnakate@gmail.com";
            final String password = "password123";

            // Check whether the admin already exists
            if (userRepository.findByEmail(email).isEmpty()) {

                User admin = new User();

                admin.setName("Admin");
                admin.setEmail(email);

                // IMPORTANT:
                // Password is stored as a BCrypt hash.
                // Never store the plain-text password.
                admin.setPassword(
                        passwordEncoder.encode(password));

                admin.setRole(Role.ADMIN);
                admin.setEnabled(true);

                userRepository.save(admin);

                System.out.println(
                        "========================================");
                System.out.println("DEFAULT ADMIN CREATED");
                System.out.println("Email: " + email);
                System.out.println("========================================");

            } else {

                System.out.println(
                        "========================================");
                System.out.println(
                        "DEFAULT ADMIN ALREADY EXISTS");
                System.out.println(
                        "Email: " + email);
                System.out.println(
                        "========================================");
            }
        };
    }
}

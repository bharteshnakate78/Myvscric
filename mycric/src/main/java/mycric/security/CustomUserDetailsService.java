package mycric.security;

import mycric.entity.User;
import mycric.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService
                implements UserDetailsService {

        private final UserRepository userRepository;

        public CustomUserDetailsService(
                        UserRepository userRepository) {

                this.userRepository = userRepository;
        }

        @Override
        public UserDetails loadUserByUsername(String email)
                        throws UsernameNotFoundException {

                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new UsernameNotFoundException(
                                                "User not found: " + email));

                String role = user.getRole() == null
                                ? "USER"
                                : user.getRole()
                                                .name()
                                                .trim()
                                                .toUpperCase();

                System.out.println(
                                "========================================");
                System.out.println("LOADING USER");
                System.out.println("Email: " + user.getEmail());
                System.out.println("Role from DB: " + role);
                System.out.println(
                                "========================================");

                return org.springframework.security.core.userdetails.User
                                .withUsername(user.getEmail())
                                .password(user.getPassword())
                                .roles(role)
                                .disabled(
                                                user.getEnabled() != null
                                                                && !user.getEnabled())
                                .build();
        }
}
package mycric.service.impl;

import mycric.dto.LoginRequest;
import mycric.dto.LoginResponse;
import mycric.dto.RegisterRequest;
import mycric.entity.Role;
import mycric.entity.User;
import mycric.repository.UserRepository;
import mycric.security.JwtService;
import mycric.service.AuthService;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthServiceImpl implements AuthService {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final AuthenticationManager authenticationManager;
        private final JwtService jwtService;

        // =========================================================
        // CONSTRUCTOR
        // =========================================================

        public AuthServiceImpl(
                        UserRepository userRepository,
                        PasswordEncoder passwordEncoder,
                        AuthenticationManager authenticationManager,
                        JwtService jwtService) {

                this.userRepository = userRepository;
                this.passwordEncoder = passwordEncoder;
                this.authenticationManager = authenticationManager;
                this.jwtService = jwtService;
        }

        // =========================================================
        // LOGIN
        // =========================================================

        @Override
        public LoginResponse login(LoginRequest request) {

                if (request == null) {
                        throw new IllegalArgumentException(
                                        "Login request is required");
                }

                if (request.getEmail() == null ||
                                request.getEmail().trim().isEmpty()) {

                        throw new IllegalArgumentException(
                                        "Email is required");
                }

                if (request.getPassword() == null ||
                                request.getPassword().isEmpty()) {

                        throw new IllegalArgumentException(
                                        "Password is required");
                }

                String email = request.getEmail()
                                .trim()
                                .toLowerCase();

                // Authenticate
                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                email,
                                                request.getPassword()));

                // Find user
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "User not found"));

                // Check enabled
                if (user.getEnabled() != null &&
                                !user.getEnabled()) {

                        throw new IllegalArgumentException(
                                        "User account is disabled");
                }

                // Get role
                String role = user.getRole() != null
                                ? user.getRole()
                                                .name()
                                                .trim()
                                                .toUpperCase()
                                : "USER";

                System.out.println();
                System.out.println("========================================");
                System.out.println("LOGIN SUCCESS");
                System.out.println("Email       : " + email);
                System.out.println("DB Role     : " + role);
                System.out.println("Authorities : " +
                                authentication.getAuthorities());
                System.out.println("========================================");

                // Generate JWT
                String token = jwtService.generateToken(authentication);

                // Create response
                LoginResponse response = new LoginResponse();

                response.setToken(token);
                response.setUserId(user.getId());
                response.setName(user.getName());
                response.setEmail(user.getEmail());
                response.setRole(role.toLowerCase());

                return response;
        }

        // =========================================================
        // REGISTER
        // =========================================================

        @Override
        public LoginResponse register(RegisterRequest request) {

                if (request == null) {
                        throw new IllegalArgumentException(
                                        "Registration request is required");
                }

                if (request.getEmail() == null ||
                                request.getEmail().trim().isEmpty()) {

                        throw new IllegalArgumentException(
                                        "Email is required");
                }

                if (request.getPassword() == null ||
                                request.getPassword().length() < 6) {

                        throw new IllegalArgumentException(
                                        "Password must contain at least 6 characters");
                }

                String email = request.getEmail()
                                .trim()
                                .toLowerCase();

                // Check duplicate email
                if (userRepository.findByEmail(email).isPresent()) {

                        throw new IllegalArgumentException(
                                        "Email already registered");
                }

                // =====================================================
                // ROLE
                // =====================================================

                // Role role = Role.USER;

                // if (request.getRole() != null &&
                // !request.getRole().trim().isEmpty()) {

                // try {

                // role = Role.valueOf(
                // request.getRole()
                // .trim()
                // .toUpperCase());

                // // Never allow ADMIN through public registration
                // if (role == Role.ADMIN) {
                // role = Role.USER;
                // }

                // } catch (IllegalArgumentException e) {

                // System.out.println(
                // "Invalid role received: "
                // + request.getRole());

                // role = Role.USER;
                // }
                // }
                Role role = Role.USER;

                if (request.getRole() != null &&
                                !request.getRole().trim().isEmpty()) {

                        try {
                                role = Role.valueOf(
                                                request.getRole()
                                                                .trim()
                                                                .toUpperCase());

                                if (role == Role.ADMIN) {
                                        role = Role.USER;
                                }

                        } catch (IllegalArgumentException e) {
                                role = Role.USER;
                        }
                }
                // =====================================================
                // CREATE USER
                // =====================================================

                User user = new User();

                user.setName(request.getName());
                user.setEmail(email);

                user.setPassword(
                                passwordEncoder.encode(
                                                request.getPassword()));

                user.setRole(role);
                user.setEnabled(true);

                // Save
                User savedUser = userRepository.save(user);

                System.out.println();
                System.out.println("========================================");
                System.out.println("USER REGISTERED");
                System.out.println("ID    : " + savedUser.getId());
                System.out.println("Name  : " + savedUser.getName());
                System.out.println("Email : " + savedUser.getEmail());
                System.out.println("Role  : " + savedUser.getRole());
                System.out.println("========================================");

                // =====================================================
                // CREATE AUTHENTICATION
                // =====================================================

                String authority = "ROLE_" +
                                savedUser.getRole()
                                                .name()
                                                .toUpperCase();

                Authentication authentication = new UsernamePasswordAuthenticationToken(
                                savedUser.getEmail(),
                                null,
                                List.of(
                                                new SimpleGrantedAuthority(
                                                                authority)));

                // Generate token
                String token = jwtService.generateToken(authentication);

                // =====================================================
                // RESPONSE
                // =====================================================

                LoginResponse response = new LoginResponse();

                response.setToken(token);
                response.setUserId(savedUser.getId());
                response.setName(savedUser.getName());
                response.setEmail(savedUser.getEmail());

                response.setRole(
                                savedUser.getRole()
                                                .name()
                                                .toLowerCase());

                return response;
        }
}
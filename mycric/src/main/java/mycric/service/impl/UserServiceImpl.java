package mycric.service.impl;

import mycric.dto.UserRequest;
import mycric.dto.UserResponse;
import mycric.entity.Role;
import mycric.entity.User;
import mycric.repository.UserRepository;
import mycric.service.UserService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserResponse createUser(UserRequest request) {

        if (request == null) {
            throw new IllegalArgumentException("User request is required");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setRole(parseRole(request.getRole()));
        user.setStatus(request.getStatus());

        return toResponse(saveUser(user));
    }

    private User saveUser(User user) {

        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }

        if (user.getName() == null || user.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }

        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        String email = user.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "User with email already exists: " + email);
        }

        user.setName(user.getName().trim());
        user.setEmail(email);

        // Default role
        if (user.getRole() == null) {
            user.setRole(Role.USER);
        }

        // Default status
        if (user.getStatus() == null || user.getStatus().trim().isEmpty()) {
            user.setStatus("ACTIVE");
        } else {
            user.setStatus(user.getStatus().trim().toUpperCase());
        }

        // Encode password
        if (user.getPassword() != null
                && !user.getPassword().trim().isEmpty()) {

            user.setPassword(
                    passwordEncoder.encode(user.getPassword()));
        } else {
            throw new IllegalArgumentException("Password is required");
        }

        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserResponseByEmail(String email) {

        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        return toResponse(userRepository.findByEmail(
                email.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found")));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserResponseById(Long id) {

        if (id == null) {
            throw new IllegalArgumentException("User ID is required");
        }

        return toResponse(userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id)));
    }

    @Override
    public UserResponse updateUser(Long id, UserRequest request) {

        if (id == null) {
            throw new IllegalArgumentException("User ID is required");
        }

        if (request == null) {
            throw new IllegalArgumentException("User request is required");
        }

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        if (request.getName() != null
                && !request.getName().trim().isEmpty()) {

            existingUser.setName(
                    request.getName().trim());
        }

        if (request.getEmail() != null
                && !request.getEmail().trim().isEmpty()) {

            String email = request.getEmail()
                    .trim()
                    .toLowerCase();

            if (!email.equalsIgnoreCase(existingUser.getEmail())
                    && userRepository.existsByEmail(email)) {

                throw new IllegalArgumentException(
                        "Email already exists: " + email);
            }

            existingUser.setEmail(email);
        }

        if (request.getRole() != null
                && !request.getRole().trim().isEmpty()) {
            existingUser.setRole(parseRole(request.getRole()));
        }

        if (request.getStatus() != null
                && !request.getStatus().trim().isEmpty()) {

            existingUser.setStatus(
                    request.getStatus()
                            .trim()
                            .toUpperCase());
        }

        // Only encode when a new plain-text password is supplied
        if (request.getPassword() != null
                && !request.getPassword().trim().isEmpty()) {

            existingUser.setPassword(
                    passwordEncoder.encode(
                            request.getPassword()));
        }

        return toResponse(userRepository.save(existingUser));
    }

    @Override
    public UserResponse toggleStatus(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "User not found with ID: " + id));

        String currentStatus = user.getStatus();

        if ("ACTIVE".equalsIgnoreCase(currentStatus)) {
            user.setStatus("INACTIVE");
            user.setEnabled(false);
        } else {
            user.setStatus("ACTIVE");
            user.setEnabled(true);
        }

        return toResponse(userRepository.save(user));
    }

    @Override
    public void deleteUser(Long id) {

        if (!userRepository.existsById(id)) {
            throw new RuntimeException(
                    "User not found with ID: " + id);
        }

        userRepository.deleteById(id);
    }

    private Role parseRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            return Role.USER;
        }

        return Role.valueOf(role.trim().toUpperCase());
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name().toLowerCase(),
                user.getStatus(),
                user.getEnabled(),
                null,
                null,
                0);
    }
}
package mycric.service.impl;

import mycric.dto.AdminCreateUserRequest;
import mycric.dto.ChangeRoleRequest;
import mycric.dto.UserResponse;
import mycric.entity.Role;
import mycric.entity.User;
import mycric.repository.UserRepository;
import mycric.service.AdminUserService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<UserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public UserResponse createUser(
            AdminCreateUserRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(
                passwordEncoder.encode(request.getPassword()));

        // Admin can choose role.
        if (request.getRole() == null) {
            user.setRole(Role.USER);
        } else {
            user.setRole(request.getRole());
        }

        User saved = userRepository.save(user);

        return toResponse(saved);
    }

    @Override
    public UserResponse changeRole(
            Long userId,
            ChangeRoleRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getRole() == null) {
            throw new RuntimeException("Role is required");
        }

        user.setRole(request.getRole());

        User updated = userRepository.save(user);

        return toResponse(updated);
    }

    @Override
    public void deleteUser(Long userId) {

        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }

        userRepository.deleteById(userId);
    }

    private UserResponse toResponse(User user) {

        UserResponse response = new UserResponse();

        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().name());

        return response;
    }
}
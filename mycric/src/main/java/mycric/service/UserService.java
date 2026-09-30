
package mycric.service;

import mycric.dto.UserRequest;
import mycric.dto.UserResponse;

import java.util.List;

public interface UserService {

    // CREATE
    UserResponse createUser(UserRequest request);

    // READ
    List<UserResponse> getAllUsers();

    UserResponse getUserResponseById(Long id);

    UserResponse getUserResponseByEmail(String email);

    // UPDATE
    UserResponse updateUser(Long id, UserRequest request);

    // STATUS
    UserResponse toggleStatus(Long id);

    // DELETE
    void deleteUser(Long id);
}

// package mycric.service;

// import mycric.entity.User;

// import java.util.List;
// import java.util.Optional;

// public interface UserService {

// User saveUser(User user);

// List<User> getAllUsers();

// Optional<User> getUserByEmail(String email);

// Optional<User> getUserById(Long id);

// User updateUser(Long id, User user);

// User toggleStatus(Long id);

// void deleteUser(Long id);
// }
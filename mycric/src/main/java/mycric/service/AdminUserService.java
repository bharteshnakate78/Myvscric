package mycric.service;

import mycric.dto.AdminCreateUserRequest;
import mycric.dto.ChangeRoleRequest;
import mycric.dto.UserResponse;

import java.util.List;

public interface AdminUserService {

    List<UserResponse> getAllUsers();

    UserResponse createUser(AdminCreateUserRequest request);

    UserResponse changeRole(
            Long userId,
            ChangeRoleRequest request);

    void deleteUser(Long userId);
}
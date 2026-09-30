package mycric.controller;

import mycric.dto.AdminCreateUserRequest;
import mycric.dto.ChangeRoleRequest;
import mycric.dto.UserResponse;
import mycric.service.AdminUserService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(
            AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {

        return ResponseEntity.ok(
                adminUserService.getAllUsers());
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @RequestBody AdminCreateUserRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(adminUserService.createUser(request));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UserResponse> changeRole(
            @PathVariable Long id,
            @RequestBody ChangeRoleRequest request) {

        return ResponseEntity.ok(
                adminUserService.changeRole(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id) {

        adminUserService.deleteUser(id);

        return ResponseEntity.noContent().build();
    }
}
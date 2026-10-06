package mycric.controller;

import mycric.dto.UserRequest;
import mycric.dto.UserResponse;
import mycric.service.UserService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

        private final UserService userService;

        public UserController(UserService userService) {
                this.userService = userService;
        }

        // =========================================================
        // CREATE USER
        // POST /api/users
        // =========================================================

        @PostMapping
        public ResponseEntity<UserResponse> createUser(
                        @RequestBody UserRequest request) {

                UserResponse response = userService.createUser(request);

                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(response);
        }

        // =========================================================
        // GET ALL USERS
        // GET /api/users
        // =========================================================

        @GetMapping
        public ResponseEntity<List<UserResponse>> getAllUsers() {

                return ResponseEntity.ok(
                                userService.getAllUsers());
        }

        // =========================================================
        // GET USER BY ID
        // GET /api/users/id/{id}
        // =========================================================

        @GetMapping("/id/{id}")
        public ResponseEntity<UserResponse> getUserById(
                        @PathVariable Long id) {

                return ResponseEntity.ok(
                                userService.getUserResponseById(id));
        }

        // =========================================================
        // GET USER BY EMAIL
        // GET /api/users/email/{email}
        // =========================================================

        @GetMapping("/email/{email}")
        public ResponseEntity<UserResponse> getUserByEmail(
                        @PathVariable String email) {

                return ResponseEntity.ok(
                                userService.getUserResponseByEmail(email));
        }

        // =========================================================
        // UPDATE USER
        // PUT /api/users/{id}
        // =========================================================

        @PutMapping("/{id}")
        public ResponseEntity<UserResponse> updateUser(
                        @PathVariable Long id,
                        @RequestBody UserRequest request) {

                return ResponseEntity.ok(
                                userService.updateUser(id, request));
        }

        // =========================================================
        // TOGGLE USER STATUS
        // PATCH /api/users/{id}/status
        // =========================================================

        @PatchMapping("/{id}/status")
        public ResponseEntity<UserResponse> toggleStatus(
                        @PathVariable Long id) {

                return ResponseEntity.ok(
                                userService.toggleStatus(id));
        }

        // =========================================================
        // DELETE USER
        // DELETE /api/users/{id}
        // =========================================================

        @DeleteMapping("/{id}")
        public ResponseEntity<Void> deleteUser(
                        @PathVariable Long id) {

                userService.deleteUser(id);

                return ResponseEntity.noContent().build();
        }
}

// package mycric.controller;

// import mycric.dto.UserRequest;
// import mycric.dto.UserResponse;
// import mycric.service.UserService;

// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.access.prepost.PreAuthorize;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;

// @RestController
// @RequestMapping("/api/users")
// @CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", methods
// = {
// RequestMethod.GET,
// RequestMethod.POST,
// RequestMethod.PUT,
// RequestMethod.PATCH,
// RequestMethod.DELETE,
// RequestMethod.OPTIONS
// })
// @PreAuthorize("hasRole('ADMIN')")
// public class UserController {

// private final UserService userService;

// public UserController(UserService userService) {
// this.userService = userService;
// }

// // =========================================================
// // CREATE USER
// // POST /api/users
// // =========================================================

// @PostMapping
// public ResponseEntity<UserResponse> createUser(
// @RequestBody UserRequest request) {

// UserResponse response = userService.createUser(request);

// return ResponseEntity
// .status(HttpStatus.CREATED)
// .body(response);
// }

// // =========================================================
// // GET ALL USERS
// // GET /api/users
// // =========================================================

// @GetMapping
// public ResponseEntity<List<UserResponse>> getAllUsers() {

// return ResponseEntity.ok(
// userService.getAllUsers());
// }

// // =========================================================
// // GET USER BY ID
// // GET /api/users/id/{id}
// // =========================================================

// @GetMapping("/id/{id}")
// public ResponseEntity<UserResponse> getUserById(
// @PathVariable Long id) {

// return ResponseEntity.ok(
// userService.getUserResponseById(id));
// }

// // =========================================================
// // GET USER BY EMAIL
// // GET /api/users/email/{email}
// // =========================================================

// @GetMapping("/email/{email}")
// public ResponseEntity<UserResponse> getUserByEmail(
// @PathVariable String email) {

// return ResponseEntity.ok(
// userService.getUserResponseByEmail(email));
// }

// // =========================================================
// // UPDATE USER
// // PUT /api/users/{id}
// // =========================================================

// @PutMapping("/{id}")
// public ResponseEntity<UserResponse> updateUser(
// @PathVariable Long id,
// @RequestBody UserRequest request) {

// return ResponseEntity.ok(
// userService.updateUser(id, request));
// }

// // =========================================================
// // TOGGLE STATUS
// // PATCH /api/users/{id}/status
// // =========================================================

// @PatchMapping("/{id}/status")
// public ResponseEntity<UserResponse> toggleStatus(
// @PathVariable Long id) {

// return ResponseEntity.ok(
// userService.toggleStatus(id));
// }

// // =========================================================
// // DELETE USER
// // DELETE /api/users/{id}
// // =========================================================

// @DeleteMapping("/{id}")
// public ResponseEntity<Void> deleteUser(
// @PathVariable Long id) {

// userService.deleteUser(id);

// return ResponseEntity
// .noContent()
// .build();
// }
// }

// // package mycric.controller;

// // import mycric.entity.User;
// // import mycric.service.UserService;
// // import org.springframework.beans.factory.annotation.Autowired;
// // import org.springframework.http.ResponseEntity;
// // import org.springframework.web.bind.annotation.*;

// // import java.util.List;
// // import java.util.Optional;

// // @RestController
// // @RequestMapping("/api/users")
// // @CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*",
// methods
// // = {
// // RequestMethod.GET,
// // RequestMethod.POST,
// // RequestMethod.PUT,
// // RequestMethod.DELETE,
// // RequestMethod.OPTIONS
// // })
// // public class UserController {

// // @Autowired
// // private UserService userService;

// // // =========================================================
// // // CREATE USER
// // // POST /api/users
// // // =========================================================

// // @PostMapping
// // public ResponseEntity<User> saveUser(
// // @RequestBody User user) {

// // return ResponseEntity.ok(
// // userService.saveUser(user));
// // }

// // // =========================================================
// // // GET ALL USERS
// // // GET /api/users
// // // =========================================================

// // @GetMapping
// // public ResponseEntity<List<User>> getAllUsers() {

// // return ResponseEntity.ok(
// // userService.getAllUsers());
// // }

// // // =========================================================
// // // GET USER BY ID
// // // GET /api/users/id/1
// // // =========================================================

// // @GetMapping("/id/{id}")
// // public ResponseEntity<User> getUserById(
// // @PathVariable Long id) {

// // Optional<User> user = userService.getUserById(id);

// // return user
// // .map(ResponseEntity::ok)
// // .orElseGet(
// // () -> ResponseEntity.notFound().build());
// // }

// // // =========================================================
// // // GET USER BY EMAIL
// // // GET /api/users/email/test@gmail.com
// // // =========================================================

// // @GetMapping("/email/{email}")
// // public ResponseEntity<User> getUserByEmail(
// // @PathVariable String email) {

// // Optional<User> user = userService.getUserByEmail(email);

// // return user
// // .map(ResponseEntity::ok)
// // .orElseGet(
// // () -> ResponseEntity.notFound().build());
// // }

// // // =========================================================
// // // UPDATE USER
// // // PUT /api/users/1
// // // =========================================================

// // @PutMapping("/{id}")
// // public ResponseEntity<User> updateUser(
// // @PathVariable Long id,
// // @RequestBody User user) {

// // return ResponseEntity.ok(
// // userService.updateUser(id, user));
// // }

// // // =========================================================
// // // TOGGLE STATUS
// // // PATCH /api/users/1/status
// // // =========================================================

// // @PatchMapping("/{id}/status")
// // public ResponseEntity<User> toggleStatus(
// // @PathVariable Long id) {

// // return ResponseEntity.ok(
// // userService.toggleStatus(id));
// // }

// // // =========================================================
// // // DELETE USER
// // // DELETE /api/users/1
// // // =========================================================

// // @DeleteMapping("/{id}")
// // public ResponseEntity<Void> deleteUser(
// // @PathVariable Long id) {

// // userService.deleteUser(id);

// // return ResponseEntity.noContent().build();
// // }
// // }
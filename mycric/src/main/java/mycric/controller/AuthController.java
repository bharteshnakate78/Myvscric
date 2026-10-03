package mycric.controller;

import mycric.dto.LoginRequest;
import mycric.dto.LoginResponse;
import mycric.dto.RegisterRequest;
import mycric.service.AuthService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

        private final AuthService authService;

        public AuthController(AuthService authService) {
                this.authService = authService;
        }

        // =========================================================
        // LOGIN
        // =========================================================

        @PostMapping("/login")
        public ResponseEntity<?> login(
                        @RequestBody LoginRequest request) {

                try {

                        LoginResponse response = authService.login(request);

                        return ResponseEntity.ok(response);

                } catch (IllegalArgumentException e) {

                        return ResponseEntity
                                        .status(HttpStatus.UNAUTHORIZED)
                                        .body(
                                                        Map.of(
                                                                        "success", false,
                                                                        "message", e.getMessage()));

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(
                                                        Map.of(
                                                                        "success", false,
                                                                        "message", "Login failed"));
                }
        }

        // =========================================================
        // REGISTER
        // =========================================================

        @PostMapping("/register")
        public ResponseEntity<?> register(
                        @RequestBody RegisterRequest request) {

                try {

                        LoginResponse response = authService.register(request);

                        return ResponseEntity
                                        .status(HttpStatus.CREATED)
                                        .body(response);

                } catch (IllegalArgumentException e) {

                        return ResponseEntity
                                        .badRequest()
                                        .body(
                                                        Map.of(
                                                                        "success", false,
                                                                        "message", e.getMessage()));

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(
                                                        Map.of(
                                                                        "success", false,
                                                                        "message", "Registration failed"));
                }
        }
}

// package mycric.controller;

// import mycric.dto.LoginRequest;
// import mycric.dto.LoginResponse;
// import mycric.dto.RegisterRequest;
// import mycric.service.AuthService;

// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.util.Map;

// @RestController
// @RequestMapping("/api/auth")
// @CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*")
// public class AuthController {

// private final AuthService authService;

// public AuthController(AuthService authService) {
// this.authService = authService;
// }

// // =========================================================
// // LOGIN
// // =========================================================

// @PostMapping("/login")
// public ResponseEntity<?> login(
// @RequestBody LoginRequest request) {

// try {

// LoginResponse response = authService.login(request);

// return ResponseEntity.ok(response);

// } catch (IllegalArgumentException e) {

// return ResponseEntity
// .status(HttpStatus.UNAUTHORIZED)
// .body(
// Map.of(
// "success", false,
// "message",
// e.getMessage()));

// } catch (Exception e) {

// e.printStackTrace();

// return ResponseEntity
// .status(
// HttpStatus.INTERNAL_SERVER_ERROR)
// .body(
// Map.of(
// "success", false,
// "message",
// "Login failed"));
// }
// }

// // =========================================================
// // REGISTER
// // =========================================================

// @PostMapping("/register")
// public ResponseEntity<?> register(
// @RequestBody RegisterRequest request) {

// try {

// LoginResponse response = authService.register(request);

// return ResponseEntity
// .status(HttpStatus.CREATED)
// .body(response);

// } catch (IllegalArgumentException e) {

// return ResponseEntity
// .badRequest()
// .body(
// Map.of(
// "success", false,
// "message",
// e.getMessage()));

// } catch (Exception e) {

// e.printStackTrace();

// return ResponseEntity
// .status(
// HttpStatus.INTERNAL_SERVER_ERROR)
// .body(
// Map.of(
// "success", false,
// "message",
// "Registration failed"));
// }
// }
// }
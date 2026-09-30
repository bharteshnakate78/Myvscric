
package mycric.service;

import mycric.dto.LoginRequest;
import mycric.dto.LoginResponse;
import mycric.dto.RegisterRequest;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    // Registration
    LoginResponse register(RegisterRequest request);
}

// package mycric.service;

// import mycric.dto.LoginRequest;
// import mycric.dto.LoginResponse;

// public interface AuthService {

// LoginResponse login(LoginRequest request);

// LoginResponse register(
// String name,
// String email,
// String role,
// String password);
// }
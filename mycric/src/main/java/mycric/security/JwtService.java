package mycric.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

        @Value("${app.jwt.secret}")
        private String jwtSecret;

        @Value("${app.jwt.expiration:86400000}")
        private long jwtExpiration;

        private SecretKey getSigningKey() {

                return Keys.hmacShaKeyFor(
                                jwtSecret.getBytes(StandardCharsets.UTF_8));
        }

        // =========================================
        // GENERATE TOKEN
        // =========================================
        public String generateToken(
                        Authentication authentication) {

                String email = authentication.getName();

                String role = authentication
                                .getAuthorities()
                                .stream()
                                .map(GrantedAuthority::getAuthority)
                                .findFirst()
                                .orElse("ROLE_USER");

                System.out.println(
                                "========================================");
                System.out.println("GENERATING JWT");
                System.out.println("Email: " + email);
                System.out.println("Role: " + role);
                System.out.println(
                                "Authorities: "
                                                + authentication.getAuthorities());
                System.out.println(
                                "========================================");

                return Jwts.builder()
                                .subject(email)
                                .claim("role", role)
                                .issuedAt(new Date())
                                .expiration(
                                                new Date(
                                                                System.currentTimeMillis()
                                                                                + jwtExpiration))
                                .signWith(getSigningKey())
                                .compact();
        }

        // =========================================
        // EXTRACT USERNAME
        // =========================================
        public String extractUsername(String token) {

                return extractAllClaims(token)
                                .getSubject();
        }

        // =========================================
        // EXTRACT ROLE
        // =========================================
        public String extractRole(String token) {

                return extractAllClaims(token)
                                .get("role", String.class);
        }

        // =========================================
        // VALIDATE TOKEN
        // =========================================
        public boolean isTokenValid(
                        String token,
                        String username) {

                try {

                        String extractedUsername = extractUsername(token);

                        return extractedUsername != null
                                        && extractedUsername.equals(username)
                                        && !isTokenExpired(token);

                } catch (Exception e) {

                        System.out.println(
                                        "Token validation error: "
                                                        + e.getMessage());

                        return false;
                }
        }

        private boolean isTokenExpired(String token) {

                return extractAllClaims(token)
                                .getExpiration()
                                .before(new Date());
        }

        private Claims extractAllClaims(String token) {

                return Jwts.parser()
                                .verifyWith(getSigningKey())
                                .build()
                                .parseSignedClaims(token)
                                .getPayload();
        }
}
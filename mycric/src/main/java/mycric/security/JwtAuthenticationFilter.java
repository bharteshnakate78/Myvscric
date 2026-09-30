package mycric.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

        private final JwtService jwtService;
        private final CustomUserDetailsService userDetailsService;

        public JwtAuthenticationFilter(
                        JwtService jwtService,
                        CustomUserDetailsService userDetailsService) {

                this.jwtService = jwtService;
                this.userDetailsService = userDetailsService;
        }

        @Override
        protected void doFilterInternal(
                        HttpServletRequest request,
                        HttpServletResponse response,
                        FilterChain filterChain)
                        throws ServletException, IOException {

                String authHeader = request.getHeader("Authorization");

                String username = null;
                String jwt = null;

                // =========================================
                // READ JWT
                // =========================================
                if (authHeader != null && authHeader.startsWith("Bearer ")) {

                        jwt = authHeader.substring(7).trim();

                        try {
                                username = jwtService.extractUsername(jwt);

                                System.out.println("========================================");
                                System.out.println("JWT RECEIVED");
                                System.out.println("URL: " + request.getRequestURI());
                                System.out.println("Username: " + username);
                                System.out.println("JWT Role: " + jwtService.extractRole(jwt));
                                System.out.println("========================================");

                        } catch (Exception e) {

                                System.out.println(
                                                "JWT extraction failed: " + e.getMessage());
                        }
                }

                // =========================================
                // AUTHENTICATE USER
                // =========================================
                if (username != null
                                && SecurityContextHolder
                                                .getContext()
                                                .getAuthentication() == null) {

                        try {

                                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                                if (jwtService.isTokenValid(jwt, username)) {

                                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                                        userDetails,
                                                        null,
                                                        userDetails.getAuthorities());

                                        authentication.setDetails(
                                                        new WebAuthenticationDetailsSource()
                                                                        .buildDetails(request));

                                        SecurityContextHolder
                                                        .getContext()
                                                        .setAuthentication(authentication);

                                        System.out.println("========================================");
                                        System.out.println("JWT AUTHENTICATION SUCCESS");
                                        System.out.println("Username: "
                                                        + userDetails.getUsername());

                                        System.out.println("JWT Role: "
                                                        + jwtService.extractRole(jwt));

                                        System.out.println("Spring Authorities: "
                                                        + userDetails.getAuthorities());

                                        System.out.println("========================================");

                                } else {

                                        System.out.println(
                                                        "JWT INVALID for: " + username);
                                }

                        } catch (Exception e) {

                                System.out.println(
                                                "JWT authentication failed: "
                                                                + e.getMessage());
                        }
                }

                filterChain.doFilter(request, response);
        }
}
package mycric.config;

import mycric.security.JwtAuthenticationFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;

import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.core.userdetails.UserDetailsService;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;

        public SecurityConfig(
                        JwtAuthenticationFilter jwtAuthenticationFilter) {

                this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        }

        // =========================================================
        // PASSWORD ENCODER
        // =========================================================

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        // =========================================================
        // USER DETAILS SERVICE
        // =========================================================

        @Bean
        public AuthenticationProvider authenticationProvider(
                        UserDetailsService userDetailsService,
                        PasswordEncoder passwordEncoder) {

                DaoAuthenticationProvider provider = new DaoAuthenticationProvider();

                provider.setUserDetailsService(userDetailsService);
                provider.setPasswordEncoder(passwordEncoder);

                return provider;
        }

        // =========================================================
        // AUTHENTICATION MANAGER
        // =========================================================

        @Bean
        public AuthenticationManager authenticationManager(
                        AuthenticationConfiguration configuration)
                        throws Exception {

                return configuration.getAuthenticationManager();
        }

        // =========================================================
        // CORS
        // =========================================================

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {

                CorsConfiguration configuration = new CorsConfiguration();

                configuration.setAllowedOriginPatterns(
                                List.of(
                                                "http://localhost:5173",
                                                "http://127.0.0.1:5173",
                                                "http://localhost:5174",
                                                "http://127.0.0.1:5174"));

                configuration.setAllowedMethods(
                                List.of(
                                                "GET",
                                                "POST",
                                                "PUT",
                                                "DELETE",
                                                "PATCH",
                                                "OPTIONS"));

                configuration.setAllowedHeaders(
                                List.of("*"));

                configuration.setExposedHeaders(
                                List.of(
                                                "Authorization",
                                                "Content-Type"));

                configuration.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

                source.registerCorsConfiguration(
                                "/**",
                                configuration);

                return source;
        }

        // =========================================================
        // SECURITY
        // =========================================================

        @Bean
        public SecurityFilterChain securityFilterChain(
                        HttpSecurity http,
                        AuthenticationProvider authenticationProvider)
                        throws Exception {

                http

                                // -------------------------------------------------
                                // CSRF
                                // -------------------------------------------------

                                .csrf(csrf -> csrf.disable())

                                // -------------------------------------------------
                                // CORS
                                // -------------------------------------------------

                                .cors(cors -> cors.configurationSource(
                                                corsConfigurationSource()))

                                // -------------------------------------------------
                                // SESSION
                                // -------------------------------------------------

                                .sessionManagement(session -> session.sessionCreationPolicy(
                                                SessionCreationPolicy.STATELESS))

                                // Distinguish missing/invalid authentication from insufficient role access.
                                .exceptionHandling(exceptions -> exceptions
                                                .authenticationEntryPoint((request, response, exception) -> response
                                                                .sendError(HttpServletResponse.SC_UNAUTHORIZED))
                                                .accessDeniedHandler((request, response, exception) -> response
                                                                .sendError(HttpServletResponse.SC_FORBIDDEN)))

                                // -------------------------------------------------
                                // AUTHORIZATION
                                // -------------------------------------------------

                                .authorizeHttpRequests(auth -> auth

                                                // OPTIONS
                                                .requestMatchers(
                                                                HttpMethod.OPTIONS,
                                                                "/**")
                                                .permitAll()

                                                // AUTH
                                                .requestMatchers(
                                                                "/api/auth/**")
                                                .permitAll()

                                                // SWAGGER
                                                .requestMatchers(
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html",
                                                                "/v3/api-docs/**")
                                                .permitAll()

                                                // WEBSOCKET
                                                .requestMatchers(
                                                                "/ws/**")
                                                .permitAll()

                                                // =================================================
                                                // PUBLIC GET APIs
                                                // =================================================

                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/api/tournaments",
                                                                "/api/tournaments/**")
                                                .permitAll()

                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/api/teams",
                                                                "/api/teams/**")
                                                .permitAll()

                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/api/players",
                                                                "/api/players/**")
                                                .permitAll()

                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/api/matches",
                                                                "/api/matches/**")
                                                .permitAll()

                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/api/scores",
                                                                "/api/scores/**")
                                                .permitAll()

                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/api/innings",
                                                                "/api/innings/**")
                                                .permitAll()

                                                // =================================================
                                                // ADMIN USER MANAGEMENT
                                                // =================================================

                                                .requestMatchers("/api/admin/users/**")
                                                .hasRole("ADMIN")

                                                // =================================================
                                                // USER MANAGEMENT
                                                // =================================================

                                                .requestMatchers(
                                                                "/api/users/**")
                                                .hasRole("ADMIN")

                                                // =================================================
                                                // TOURNAMENT
                                                // =================================================

                                                .requestMatchers(
                                                                HttpMethod.POST,
                                                                "/api/tournaments",
                                                                "/api/tournaments/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                .requestMatchers(
                                                                HttpMethod.PUT,
                                                                "/api/tournaments/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                .requestMatchers(
                                                                HttpMethod.DELETE,
                                                                "/api/tournaments/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                // =================================================
                                                // TEAM
                                                // =================================================

                                                .requestMatchers(
                                                                HttpMethod.POST,
                                                                "/api/teams",
                                                                "/api/teams/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                .requestMatchers(
                                                                HttpMethod.PUT,
                                                                "/api/teams/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                .requestMatchers(
                                                                HttpMethod.DELETE,
                                                                "/api/teams/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                // =================================================
                                                // PLAYER
                                                // =================================================

                                                .requestMatchers(
                                                                HttpMethod.POST,
                                                                "/api/players",
                                                                "/api/players/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER")

                                                .requestMatchers(
                                                                HttpMethod.PUT,
                                                                "/api/players/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER")

                                                .requestMatchers(
                                                                HttpMethod.DELETE,
                                                                "/api/players/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER")

                                                // =================================================
                                                // MATCH
                                                // =================================================

                                                .requestMatchers(
                                                                HttpMethod.POST,
                                                                "/api/matches",
                                                                "/api/matches/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                .requestMatchers(
                                                                HttpMethod.PUT,
                                                                "/api/matches/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                .requestMatchers(
                                                                HttpMethod.DELETE,
                                                                "/api/matches/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                // =================================================
                                                // SCORE
                                                // =================================================

                                                .requestMatchers(
                                                                HttpMethod.POST,
                                                                "/api/scores/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                .requestMatchers(
                                                                HttpMethod.PUT,
                                                                "/api/scores/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                // =================================================
                                                // EVERYTHING ELSE
                                                // =================================================

                                                .anyRequest().authenticated())

                                // -------------------------------------------------
                                // AUTHENTICATION PROVIDER
                                // -------------------------------------------------

                                .authenticationProvider(
                                                authenticationProvider)

                                // -------------------------------------------------
                                // JWT FILTER
                                // -------------------------------------------------

                                .addFilterBefore(
                                                jwtAuthenticationFilter,
                                                UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }
}
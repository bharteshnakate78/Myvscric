package mycric.config;

import mycric.security.JwtAuthenticationFilter;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;

import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.core.userdetails.UserDetailsService;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfigurationSource;

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
        // AUTHENTICATION PROVIDER
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
        // SECURITY FILTER CHAIN
        // =========================================================

        @Bean
        public SecurityFilterChain securityFilterChain(
                        HttpSecurity http,
                        AuthenticationProvider authenticationProvider,
                        CorsConfigurationSource corsConfigurationSource)
                        throws Exception {

                http

                                // -------------------------------------------------
                                // CSRF
                                // -------------------------------------------------

                                .csrf(csrf -> csrf.disable())

                                // -------------------------------------------------
                                // CORS
                                // -------------------------------------------------

                                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                                // -------------------------------------------------
                                // SESSION
                                // -------------------------------------------------

                                .sessionManagement(session -> session.sessionCreationPolicy(
                                                SessionCreationPolicy.STATELESS))

                                // -------------------------------------------------
                                // EXCEPTION HANDLING
                                // -------------------------------------------------

                                .exceptionHandling(exceptions -> exceptions

                                                .authenticationEntryPoint(
                                                                (request, response, exception) -> response.sendError(
                                                                                HttpServletResponse.SC_UNAUTHORIZED))

                                                .accessDeniedHandler(
                                                                (request, response, exception) -> response.sendError(
                                                                                HttpServletResponse.SC_FORBIDDEN)))

                                // -------------------------------------------------
                                // AUTHORIZATION
                                // -------------------------------------------------

                                .authorizeHttpRequests(auth -> auth

                                                // =================================================
                                                // CORS PREFLIGHT
                                                // =================================================

                                                .requestMatchers(
                                                                HttpMethod.OPTIONS,
                                                                "/**")
                                                .permitAll()

                                                // =================================================
                                                // HOME / HEALTH
                                                // =================================================

                                                .requestMatchers(
                                                                "/",
                                                                "/api/test")
                                                .permitAll()

                                                // =================================================
                                                // AUTH
                                                // =================================================

                                                .requestMatchers(
                                                                "/api/auth/**")
                                                .permitAll()

                                                // =================================================
                                                // SWAGGER
                                                // =================================================

                                                .requestMatchers(
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html",
                                                                "/v3/api-docs/**")
                                                .permitAll()

                                                // =================================================
                                                // WEBSOCKET
                                                // =================================================

                                                .requestMatchers(
                                                                "/ws/**")
                                                .permitAll()

                                                // =================================================
                                                // PUBLIC GET - TOURNAMENTS
                                                // =================================================

                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/api/tournaments",
                                                                "/api/tournaments/**")
                                                .permitAll()

                                                // =================================================
                                                // PUBLIC GET - TEAMS
                                                // =================================================

                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/api/teams",
                                                                "/api/teams/**")
                                                .permitAll()

                                                // =================================================
                                                // PUBLIC GET - PLAYERS
                                                // =================================================

                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/api/players",
                                                                "/api/players/**")
                                                .permitAll()

                                                // =================================================
                                                // PUBLIC GET - MATCHES
                                                // =================================================

                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/api/matches",
                                                                "/api/matches/**")
                                                .permitAll()

                                                // =================================================
                                                // PUBLIC GET - SCORES
                                                // =================================================

                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/api/scores",
                                                                "/api/scores/**")
                                                .permitAll()

                                                // =================================================
                                                // PUBLIC GET - INNINGS
                                                // =================================================

                                                .requestMatchers(
                                                                HttpMethod.GET,
                                                                "/api/innings",
                                                                "/api/innings/**")
                                                .permitAll()

                                                // =================================================
                                                // ADMIN USER MANAGEMENT
                                                // =================================================

                                                .requestMatchers(
                                                                "/api/admin/users/**")
                                                .hasRole("ADMIN")

                                                // =================================================
                                                // USER MANAGEMENT
                                                // =================================================

                                                .requestMatchers(
                                                                "/api/users/**")
                                                .hasRole("ADMIN")

                                                // =================================================
                                                // TOURNAMENT WRITE ACCESS
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
                                                // TEAM WRITE ACCESS
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
                                                                "/api/teams",
                                                                "/api/teams/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                .requestMatchers(
                                                                HttpMethod.DELETE,
                                                                "/api/teams",
                                                                "/api/teams/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                // =================================================
                                                // PLAYER WRITE ACCESS
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
                                                                "/api/players",
                                                                "/api/players/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER")

                                                .requestMatchers(
                                                                HttpMethod.DELETE,
                                                                "/api/players",
                                                                "/api/players/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER")

                                                // =================================================
                                                // MATCH WRITE ACCESS
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
                                                                "/api/matches",
                                                                "/api/matches/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                .requestMatchers(
                                                                HttpMethod.DELETE,
                                                                "/api/matches",
                                                                "/api/matches/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                // =================================================
                                                // SCORE WRITE ACCESS
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

                                                .requestMatchers(
                                                                HttpMethod.DELETE,
                                                                "/api/scores/**")
                                                .hasAnyRole(
                                                                "ADMIN",
                                                                "ORGANIZER",
                                                                "SCORER")

                                                // =================================================
                                                // EVERYTHING ELSE
                                                // =================================================

                                                .anyRequest()
                                                .authenticated())

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

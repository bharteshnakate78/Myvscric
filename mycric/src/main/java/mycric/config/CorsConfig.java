package mycric.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "https://myvscric.vercel.app"));

        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "PATCH",
                "OPTIONS"));

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
// package mycric.config;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.web.cors.CorsConfiguration;
// import org.springframework.web.cors.CorsConfigurationSource;
// import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

// import java.util.List;

// @Configuration
// public class CorsConfig {

// @Bean
// public CorsConfigurationSource corsConfigurationSource() {

// CorsConfiguration configuration = new CorsConfiguration();

// // IMPORTANT:
// // Do NOT use allowedOrigins("*") together with allowCredentials(true)
// configuration.setAllowedOriginPatterns(List.of(
// "http://localhost:5173",
// "http://localhost:3000"
// ));

// configuration.setAllowedMethods(List.of(
// "GET",
// "POST",
// "PUT",
// "DELETE",
// "PATCH",
// "OPTIONS"
// ));

// configuration.setAllowedHeaders(List.of("*"));

// configuration.setAllowCredentials(true);

// configuration.setExposedHeaders(List.of(
// "Authorization",
// "Content-Type"
// ));

// UrlBasedCorsConfigurationSource source =
// new UrlBasedCorsConfigurationSource();

// source.registerCorsConfiguration("/**", configuration);

// return source;
// }
// }
// package mycric.config;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.web.servlet.config.annotation.CorsRegistry;
// import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// @Configuration
// public class CorsConfig {

// @Bean
// public WebMvcConfigurer corsConfigurer() {

// return new WebMvcConfigurer() {

// @Override
// public void addCorsMappings(CorsRegistry registry) {

// registry.addMapping("/**")
// .allowedOrigins("http://localhost:3000",
// "http://localhost:5173")
// .allowedMethods("*")
// .allowedHeaders("*")
// .allowCredentials(true);
// }
// };
// }
// }
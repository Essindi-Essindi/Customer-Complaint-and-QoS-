package customer_complaint.customer_complaint.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// allows the react frontend to call the api
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    // allowedOriginPatterns (not allowedOrigins) so the wildcard LAN entries
    // in the default can coexist with allowCredentials(true) — Spring
    // rejects a literal "*" origin once credentials are allowed, but a
    // pattern like 192.168.*.* is fine. The LAN patterns are what let a
    // phone on the same Wi-Fi hit the API when the frontend is opened via
    // the dev machine's LAN IP instead of localhost (see README/dev notes
    // on exposing the dev server with `--host`). In production, set
    // CORS_ALLOWED_ORIGINS to the real frontend origin(s) instead.
    @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://localhost:4173,http://192.168.*.*:*,http://10.*.*.*:*,http://172.16.*.*:*}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}

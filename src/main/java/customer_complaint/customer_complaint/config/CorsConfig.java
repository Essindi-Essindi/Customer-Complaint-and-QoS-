package customer_complaint.customer_complaint.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// cors setup
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    // default config values
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

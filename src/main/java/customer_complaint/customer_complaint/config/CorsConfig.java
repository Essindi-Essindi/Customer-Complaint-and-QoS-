package customer_complaint.customer_complaint.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// setup cors config
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                // origin patterns setup
                .allowedOriginPatterns(
                        "http://localhost:5173", "http://localhost:3000", "http://localhost:4173",
                        "http://192.168.*.*:*", "http://10.*.*.*:*", "http://172.16.*.*:*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}

package customer_complaint.customer_complaint.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// api docs config
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI complaintPlatformOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("CAMTEL Complaint Platform API")
                        .description("Customer Complaint and QoS Tracking Platform")
                        .version("v1"));
    }
}

package customer_complaint.customer_complaint.security;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // without this, every @PreAuthorize in the controllers is silently ignored
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitingFilter rateLimitingFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Both JwtAuthenticationFilter and RateLimitingFilter are @Component beans that extend
    // OncePerRequestFilter, so Spring Boot would otherwise ALSO auto-register them as generic
    // servlet filters applied to every request, outside/before the Spring Security chain built
    // below. That extra, uncontrolled run happens before Spring Security's own
    // SecurityContextHolderFilter, which (because of STATELESS session policy) always starts the
    // chain with a fresh, empty security context — wiping out whatever the stray filter set.
    // Then, when the *real*, correctly-positioned filter instance runs inside the chain,
    // OncePerRequestFilter's "already filtered" guard makes it skip itself, since it thinks it
    // already ran for this request. Net result: JWTs are parsed but authentication never sticks,
    // and every protected endpoint sees the caller as anonymous -> 403 Forbidden even with a
    // valid token. Disabling Boot's auto-registration here ensures each filter runs exactly once,
    // in the position we explicitly configure in securityFilterChain() below.
    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterRegistration(
            JwtAuthenticationFilter filter) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration =
                new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public FilterRegistrationBean<RateLimitingFilter> rateLimitingFilterRegistration(
            RateLimitingFilter filter) {
        FilterRegistrationBean<RateLimitingFilter> registration =
                new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();

        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {

        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authenticationProvider(authenticationProvider())

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/actuator/health"
                        ).permitAll()

                        .requestMatchers("/api/agent/**")
                        .hasAnyRole("AGENT", "MANAGER")

                        .requestMatchers(
                                "/api/manager/**",
                                "/api/analytics/**",
                                "/api/reports/**")
                        .hasRole("MANAGER")

                        .anyRequest()
                        .authenticated())

                .addFilterBefore(rateLimitingFilter,
                        UsernamePasswordAuthenticationFilter.class)

                .addFilterAfter(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
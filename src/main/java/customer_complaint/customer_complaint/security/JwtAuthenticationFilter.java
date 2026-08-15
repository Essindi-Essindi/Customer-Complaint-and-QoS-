package customer_complaint.customer_complaint.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// reads the bearer token on every request
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtTokenProvider.isTokenValid(token)) {
                String userId = jwtTokenProvider.getSubjectFromToken(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(userId);

                // FIX: previously this authenticated the caller purely from the token's signature,
                // never re-checking whether the account behind it is still active. That meant a
                // manager deactivating an agent/subscriber had zero effect on that user's existing
                // token - it kept working for up to 24h (jwt.expiration-ms). isEnabled() is already
                // wired to user.isActive() in CustomUserDetails; it just wasn't being read. If the
                // account is disabled we simply don't set an Authentication, so the request falls
                // through as anonymous and gets rejected by the normal authorization rules.
                if (userDetails.isEnabled()) {
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
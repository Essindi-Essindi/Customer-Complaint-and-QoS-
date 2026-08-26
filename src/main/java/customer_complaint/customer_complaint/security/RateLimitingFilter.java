package customer_complaint.customer_complaint.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_WINDOW = 20;
    private static final long WINDOW_MILLIS = 60_000; // default value

    private final ConcurrentHashMap<String, Window> requestWindows = new ConcurrentHashMap<>();

    private static final class Window {
        volatile long windowStart;
        final AtomicInteger count = new AtomicInteger(0);

        Window(long windowStart) {
            this.windowStart = windowStart;
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        if (request.getRequestURI().startsWith("/api/complaints")) {

            String ip = request.getRemoteAddr();
            long now = System.currentTimeMillis();

            Window window = requestWindows.computeIfAbsent(ip, k -> new Window(now));

            boolean limited;
            synchronized (window) {
                if (now - window.windowStart >= WINDOW_MILLIS) {
                    window.windowStart = now;
                    window.count.set(0);
                }
                limited = window.count.incrementAndGet() > MAX_REQUESTS_PER_WINDOW;
            }

            if (limited) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Too many requests, slow down");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
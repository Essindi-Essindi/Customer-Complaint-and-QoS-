package customer_complaint.customer_complaint.controller;

import customer_complaint.customer_complaint.dto.response.AppNotificationResponse;
import customer_complaint.customer_complaint.security.CustomUserDetails;
import customer_complaint.customer_complaint.service.AppNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

// In-app notifications for whichever actor is logged in — subscriber, agent
// or manager. Not restricted to a role: SecurityConfig falls through to
// .anyRequest().authenticated() for this path, so any signed-in account can
// read its own feed. The frontend polls GET / every ~5s using `since` as a
// cursor to only pull what's new.
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final AppNotificationService appNotificationService;

    @GetMapping
    public ResponseEntity<List<AppNotificationResponse>> list(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since) {
        return ResponseEntity.ok(appNotificationService.list(principal.getUser().getId(), since));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> unreadCount(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(appNotificationService.unreadCount(principal.getUser().getId()));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@AuthenticationPrincipal CustomUserDetails principal, @PathVariable Long id) {
        appNotificationService.markRead(principal.getUser().getId(), id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal CustomUserDetails principal) {
        appNotificationService.markAllRead(principal.getUser().getId());
        return ResponseEntity.ok().build();
    }
}

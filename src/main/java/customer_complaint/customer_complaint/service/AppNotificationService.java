package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.dto.response.AppNotificationResponse;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.User;

import java.time.LocalDateTime;
import java.util.List;

// in-app (bell/toast) notifications — distinct from NotificationService,
// which only queues the subscriber's SMS/email. This fans out to whichever
// actor(s) a given complaint event actually concerns: the subscriber, the
// assigned agent, or every manager.
public interface AppNotificationService {

    void notifyUser(User recipient, Complaint complaint, String type, String message);

    // Every active manager — managers aren't scoped to a region/service in
    // this system, so "notify the manager" means all of them.
    void notifyManagers(Complaint complaint, String type, String message);

    // since == null: most recent page. since != null: only what's newer —
    // this is what the frontend's 5s poll uses after the first load.
    List<AppNotificationResponse> list(Long userId, LocalDateTime since);

    long unreadCount(Long userId);

    void markRead(Long userId, Long notificationId);

    void markAllRead(Long userId);
}

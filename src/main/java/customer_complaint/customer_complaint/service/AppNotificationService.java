package customer_complaint.customer_complaint.service;

import customer_complaint.customer_complaint.dto.response.AppNotificationResponse;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.User;

import java.time.LocalDateTime;
import java.util.List;

// handle notifications
public interface AppNotificationService {

    void notifyUser(User recipient, Complaint complaint, String type, String message);

    // send notification
    void notifyManagers(Complaint complaint, String type, String message);

    // fetch data
    List<AppNotificationResponse> list(Long userId, LocalDateTime since);

    long unreadCount(Long userId);

    void markRead(Long userId, Long notificationId);

    void markAllRead(Long userId);
}

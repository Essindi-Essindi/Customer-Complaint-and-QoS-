package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.dto.response.AppNotificationResponse;
import customer_complaint.customer_complaint.model.AppNotification;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Manager;
import customer_complaint.customer_complaint.model.User;
import customer_complaint.customer_complaint.repository.AppNotificationRepository;
import customer_complaint.customer_complaint.repository.UserRepository;
import customer_complaint.customer_complaint.service.AppNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppNotificationServiceImpl implements AppNotificationService {

    // Most a single poll response (or the initial page load) will ever carry.
    private static final int PAGE_LIMIT = 30;

    private final AppNotificationRepository appNotificationRepository;
    private final UserRepository userRepository;

    @Override
    public void notifyUser(User recipient, Complaint complaint, String type, String message) {
        if (recipient == null) return;

        AppNotification notification = new AppNotification();
        notification.setRecipient(recipient);
        notification.setComplaint(complaint);
        notification.setType(type);
        notification.setMessage(message);
        notification.setTicketNumber(complaint != null ? complaint.getTicketNumber() : null);
        appNotificationRepository.save(notification);
    }

    @Override
    public void notifyManagers(Complaint complaint, String type, String message) {
        for (Manager manager : userRepository.findActiveManagers()) {
            notifyUser(manager, complaint, type, message);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppNotificationResponse> list(Long userId, LocalDateTime since) {
        List<AppNotification> notifications = since != null
                ? appNotificationRepository.findByRecipientIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, since)
                : appNotificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, PageRequest.of(0, PAGE_LIMIT));

        return notifications.stream()
                .map(n -> new AppNotificationResponse(
                        n.getId(), n.getType(), n.getMessage(), n.getTicketNumber(), n.isRead(), n.getCreatedAt()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return appNotificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    @Override
    @Transactional
    public void markRead(Long userId, Long notificationId) {
        appNotificationRepository.markRead(notificationId, userId);
    }

    @Override
    @Transactional
    public void markAllRead(Long userId) {
        appNotificationRepository.markAllRead(userId);
    }
}

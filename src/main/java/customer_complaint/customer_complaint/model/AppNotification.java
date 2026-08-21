package customer_complaint.customer_complaint.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// in-app notification shown to a subscriber/agent/manager while they're on
// the site (bell + toast) — separate from Notification, which is the SMS
// delivery queue. This one has no delivery pipeline, just a read flag; the
// frontend polls GET /api/notifications every few seconds.
@Entity
@Table(name = "app_notifications", indexes = {
        @Index(name = "idx_app_notif_recipient", columnList = "recipient_id"),
        @Index(name = "idx_app_notif_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
public class AppNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id")
    private Complaint complaint;

    // e.g. COMPLAINT_SUBMITTED, COMPLAINT_ASSIGNED, COMPLAINT_CLAIMED,
    // STATUS_CHANGED, COMPLAINT_RESOLVED, COMPLAINT_RATED
    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    // Denormalized so the frontend can show/link the ticket without a join.
    @Column(name = "ticket_number", length = 50)
    private String ticketNumber;

    // Explicit column name: `read` is a reserved word in MySQL (used in
    // LOCK TABLES ... READ), so leaving Hibernate to default the column
    // name to `read` breaks the CREATE/ALTER TABLE DDL under ddl-auto=update.
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

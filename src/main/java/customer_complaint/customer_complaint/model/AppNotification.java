package customer_complaint.customer_complaint.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// entity class
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

    // entity field
    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    // entity field
    @Column(name = "ticket_number", length = 50)
    private String ticketNumber;

    // column mapping
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

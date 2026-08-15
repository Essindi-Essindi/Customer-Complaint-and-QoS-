package customer_complaint.customer_complaint.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// Base user, single-table inheritance discriminated by role
// base user, shared by subscriber/agent/manager
@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "role", discriminatorType = DiscriminatorType.STRING)
@Getter
@Setter
@NoArgsConstructor
public abstract class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    // Nullable as of the email-or-phone signup change: a subscriber can
    // register with just a phone number, so this can't be required at the
    // column level anymore. Still unique — both MySQL and Postgres treat
    // multiple NULLs as distinct, so any number of accounts can have no
    // email without colliding. Agents/managers always populate this
    // (UserCreateRequest still requires it); only Subscriber rows can be
    // null here. See EmailOrPhoneRequired for the "at least one" rule.
    @Column(length = 150, unique = true)
    private String email;

    @Column(length = 20, unique = true)
    private String phone;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}

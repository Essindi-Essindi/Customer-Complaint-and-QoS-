package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.Agent;
import customer_complaint.customer_complaint.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// lookups used for auth and duplicate checks
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    // Login lookup: `identifier` may be either the account's email or its
    // phone number, since a subscriber can now register with only one of
    // the two. SQL equality against a NULL column never matches, so this
    // can't accidentally match every phone-less/email-less account at once.
    @Query("SELECT u FROM User u WHERE :identifier = u.email OR :identifier = u.phone")
    Optional<User> findByEmailOrPhone(@Param("identifier") String identifier);

    // All active agents assigned to a particular service
    @Query("SELECT a FROM Agent a WHERE a.assignedService = :service AND a.active = true")
    List<Agent> findActiveAgentsByService(@Param("service") String service);
}
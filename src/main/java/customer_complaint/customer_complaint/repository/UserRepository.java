package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.Agent;
import customer_complaint.customer_complaint.model.Manager;
import customer_complaint.customer_complaint.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// auth-related lookups
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    // login lookup
    @Query("SELECT u FROM User u WHERE :identifier = u.email OR :identifier = u.phone")
    Optional<User> findByEmailOrPhone(@Param("identifier") String identifier);

    // custom query
    @Query("SELECT a FROM Agent a WHERE a.assignedService = :service AND a.active = true")
    List<Agent> findActiveAgentsByService(@Param("service") String service);

    // fetch active records
    @Query("SELECT m FROM Manager m WHERE m.active = true")
    List<Manager> findActiveManagers();

    // native query
    @Query(value = "SELECT * FROM users WHERE (:role IS NULL OR role = :role)",
            countQuery = "SELECT COUNT(*) FROM users WHERE (:role IS NULL OR role = :role)",
            nativeQuery = true)
    Page<User> findPageByRole(@Param("role") String role, Pageable pageable);
}
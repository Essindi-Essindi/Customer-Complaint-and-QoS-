package customer_complaint.customer_complaint.repository;

import customer_complaint.customer_complaint.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// lookups used for auth and duplicate checks
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);
}

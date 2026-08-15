package customer_complaint.customer_complaint.security;

import customer_complaint.customer_complaint.model.User;
import customer_complaint.customer_complaint.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

// Reloads the authenticated user on every request. Despite the interface's
// "username" naming, the value passed in is the JWT subject, which is the
// user's numeric id (see JwtTokenProvider) — not their email, since email is
// now optional for subscribers. Only JwtAuthenticationFilter calls this;
// login itself is handled entirely by AuthServiceImpl without going through
// Spring's AuthenticationManager.
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        Long id;
        try {
            id = Long.valueOf(userId);
        } catch (NumberFormatException ex) {
            throw new UsernameNotFoundException("Invalid user id " + userId);
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("No user with id " + userId));
        return new CustomUserDetails(user);
    }
}

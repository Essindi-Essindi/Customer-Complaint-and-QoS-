package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Resolution;
import customer_complaint.customer_complaint.model.User;
import customer_complaint.customer_complaint.repository.ResolutionRepository;
import customer_complaint.customer_complaint.repository.UserRepository;
import customer_complaint.customer_complaint.service.ResolutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

// saves the resolution note and timestamp
@Service
@RequiredArgsConstructor
public class ResolutionServiceImpl implements ResolutionService {

    private final ResolutionRepository resolutionRepository;
    private final UserRepository userRepository;

    @Override
    public void resolve(Complaint complaint, Long resolvedByUserId, String note) {
        Resolution resolution = new Resolution();
        resolution.setComplaint(complaint);
        resolution.setNote(note);
        resolution.setResolvedAt(LocalDateTime.now());

        if (resolvedByUserId != null) {
            User resolvedBy = userRepository.findById(resolvedByUserId).orElse(null);
            resolution.setResolvedBy(resolvedBy);
        }

        resolutionRepository.save(resolution);
    }
}

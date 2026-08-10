package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.exception.ResourceNotFoundException;
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

    // FIX: previously always `new Resolution()` and inserted. Resolution.complaint is a @OneToOne
    // join column, unique by default - resolving the same complaint a second time (status
    // corrected, reopened and re-resolved, or just re-running this test) collided with that
    // constraint and threw a 500. Now it updates the existing row if one's already there.
    @Override
    public void resolve(Complaint complaint, Long resolvedByUserId, String note) {
        Resolution resolution = resolutionRepository.findByComplaintId(complaint.getId())
                .orElseGet(Resolution::new);

        resolution.setComplaint(complaint);
        resolution.setNote(note);
        resolution.setResolvedAt(LocalDateTime.now());

        if (resolvedByUserId != null) {
            User resolvedBy = userRepository.findById(resolvedByUserId).orElse(null);
            resolution.setResolvedBy(resolvedBy);
        }

        resolutionRepository.save(resolution);
    }

    @Override
    public void rate(Long complaintId, int score, String comment) {
        Resolution resolution = resolutionRepository.findByComplaintId(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "This complaint has not been resolved yet, so it can't be rated"));

        resolution.setRating(score);
        resolution.setRatingComment(comment);
        resolutionRepository.save(resolution);
    }
}
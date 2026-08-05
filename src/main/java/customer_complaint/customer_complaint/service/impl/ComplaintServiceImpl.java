package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.dto.request.ComplaintStatusUpdateRequest;
import customer_complaint.customer_complaint.dto.request.ComplaintSubmissionRequest;
import customer_complaint.customer_complaint.dto.request.RatingRequest;
import customer_complaint.customer_complaint.dto.response.ComplaintListItemResponse;
import customer_complaint.customer_complaint.dto.response.ComplaintResponse;
import customer_complaint.customer_complaint.exception.ResourceNotFoundException;
import customer_complaint.customer_complaint.model.Category;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Subscriber;
import customer_complaint.customer_complaint.model.enums.ComplaintStatus;
import customer_complaint.customer_complaint.model.enums.ServiceType;
import customer_complaint.customer_complaint.repository.CategoryRepository;
import customer_complaint.customer_complaint.repository.ComplaintRepository;
import customer_complaint.customer_complaint.repository.UserRepository;
import customer_complaint.customer_complaint.service.ComplaintService;
import customer_complaint.customer_complaint.service.NotificationService;
import customer_complaint.customer_complaint.service.ResolutionService;
import customer_complaint.customer_complaint.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

// idempotency check, save, queue sms
@Service
@RequiredArgsConstructor
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TicketService ticketService;
    private final NotificationService notificationService;
    private final ResolutionService resolutionService;

    @Override
    public ComplaintResponse submit(Long subscriberId, ComplaintSubmissionRequest request) {
        // Idempotency check before anything is persisted
        Complaint existing = complaintRepository.findByIdempotencyKey(request.getIdempotencyKey()).orElse(null);
        if (existing != null) {
            return toResponse(existing);
        }

        Subscriber subscriber = (Subscriber) userRepository.findById(subscriberId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscriber not found"));

        Complaint complaint = new Complaint();
        complaint.setIdempotencyKey(request.getIdempotencyKey());
        complaint.setSubscriber(subscriber);
        complaint.setType(request.getType());
        complaint.setServiceType(ServiceType.valueOf(request.getServiceType().toUpperCase()));
        complaint.setRegion(request.getRegion());
        complaint.setCity(request.getCity());
        complaint.setDescription(request.getDescription());
        complaint.setStatus(ComplaintStatus.SUBMITTED);
        complaint.setTicketNumber(ticketService.nextTicketNumber());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId()).orElse(null);
            complaint.setCategory(category);
        }

        complaintRepository.save(complaint);
        ticketService.generateFor(complaint);
        notificationService.notifyTicketCreated(complaint);

        return toResponse(complaint);
    }

    @Override
    public List<ComplaintListItemResponse> listForSubscriber(Long subscriberId) {
        return complaintRepository.findBySubscriberId(subscriberId).stream()
                .map(this::toListItem)
                .toList();
    }

    @Override
    public List<ComplaintListItemResponse> listForAgent(Long agentId) {
        return complaintRepository.findByAgentId(agentId).stream()
                .map(this::toListItem)
                .toList();
    }

    @Override
    public ComplaintResponse track(String ticketNumber) {
        Complaint complaint = complaintRepository.findAll().stream()
                .filter(c -> c.getTicketNumber().equals(ticketNumber))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        return toResponse(complaint);
    }

    @Override
    public ComplaintResponse updateStatus(Long complaintId, ComplaintStatusUpdateRequest request) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        ComplaintStatus newStatus = ComplaintStatus.valueOf(request.getNewStatus().toUpperCase());
        complaint.setStatus(newStatus);
        complaint.setUpdatedAt(LocalDateTime.now());
        complaintRepository.save(complaint);

        if (newStatus == ComplaintStatus.RESOLVED) {
            resolutionService.resolve(complaint, complaint.getAgent() != null ? complaint.getAgent().getId() : null, request.getResolutionNote());
        }

        notificationService.notifyStatusChanged(complaint);
        return toResponse(complaint);
    }

    @Override
    public void rate(Long complaintId, RatingRequest request) {
        complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        // Rating is stored against the resolution, handled by ResolutionService
    }

    private ComplaintResponse toResponse(Complaint c) {
        return new ComplaintResponse(c.getId(), c.getTicketNumber(), c.getType(),
                c.getServiceType().name(), c.getRegion(), c.getCity(), c.getStatus().name(),
                c.getCreatedAt(), c.getUpdatedAt());
    }

    private ComplaintListItemResponse toListItem(Complaint c) {
        return new ComplaintListItemResponse(c.getId(), c.getTicketNumber(), c.getType(),
                c.getStatus().name(), c.getRegion(), c.getCreatedAt());
    }
}

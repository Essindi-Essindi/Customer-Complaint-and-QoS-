package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.dto.request.ComplaintStatusUpdateRequest;
import customer_complaint.customer_complaint.dto.request.ComplaintSubmissionRequest;
import customer_complaint.customer_complaint.dto.request.RatingRequest;
import customer_complaint.customer_complaint.dto.response.ComplaintListItemResponse;
import customer_complaint.customer_complaint.dto.response.ComplaintManagerListItemResponse;
import customer_complaint.customer_complaint.dto.response.ComplaintResponse;
import customer_complaint.customer_complaint.exception.ResourceNotFoundException;
import customer_complaint.customer_complaint.model.Agent;
import customer_complaint.customer_complaint.model.Category;
import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Subscriber;
import customer_complaint.customer_complaint.model.User;
import customer_complaint.customer_complaint.model.enums.ComplaintStatus;
import customer_complaint.customer_complaint.model.enums.ServiceType;
import customer_complaint.customer_complaint.repository.CategoryRepository;
import customer_complaint.customer_complaint.repository.ComplaintRepository;
import customer_complaint.customer_complaint.repository.ComplaintSpecifications;
import customer_complaint.customer_complaint.repository.UserRepository;
import customer_complaint.customer_complaint.service.ComplaintService;
import customer_complaint.customer_complaint.service.NotificationService;
import customer_complaint.customer_complaint.service.ResolutionService;
import customer_complaint.customer_complaint.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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
        complaint.setServiceType(parseServiceType(request.getServiceType()));
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
    public List<ComplaintListItemResponse> listForService(String serviceType) {
        ServiceType st = parseServiceType(serviceType);
        return complaintRepository.findByServiceType(st).stream()
                .map(this::toListItem)
                .toList();
    }

    @Override
    public Page<ComplaintManagerListItemResponse> listForManager(
            String type, String serviceType, String region, String status,
            LocalDate start, LocalDate end, Pageable pageable) {

        Specification<Complaint> spec = Specification.where(ComplaintSpecifications.hasType(type))
                .and(ComplaintSpecifications.hasServiceType(serviceType != null ? parseServiceType(serviceType) : null))
                .and(ComplaintSpecifications.hasRegion(region))
                .and(ComplaintSpecifications.hasStatus(status != null ? parseStatus(status) : null))
                .and(ComplaintSpecifications.createdBetween(
                        start != null ? start.atStartOfDay() : null,
                        end != null ? end.atTime(23, 59, 59) : null));

        return complaintRepository.findAll(spec, pageable).map(this::toManagerListItem);
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
    public ComplaintResponse updateStatus(User actor, Long complaintId, ComplaintStatusUpdateRequest request) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        if (actor instanceof Agent) {
            boolean assignedToThisAgent = complaint.getAgent() != null
                    && complaint.getAgent().getId().equals(actor.getId());
            if (!assignedToThisAgent) {
                throw new AccessDeniedException("You can only update complaints assigned to you");
            }
        }

        ComplaintStatus newStatus = parseStatus(request.getNewStatus());
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
    public ComplaintResponse claim(Long complaintId, Long agentId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        if (complaint.getAgent() != null) {
            throw new IllegalStateException("This complaint is already assigned to an agent");
        }

        Agent agent = (Agent) userRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found"));

        complaint.setAgent(agent);
        if (complaint.getStatus() == ComplaintStatus.SUBMITTED) {
            complaint.setStatus(ComplaintStatus.ASSIGNED);
        }
        complaint.setUpdatedAt(LocalDateTime.now());
        complaintRepository.save(complaint);

        // FIX: claiming a complaint moves it to ASSIGNED but never told the
        // subscriber - no SMS, no email, nothing. Both notification channels
        // only ever fired from submit() and updateStatus().
        notificationService.notifyStatusChanged(complaint);

        return toResponse(complaint);
    }

    @Override
    public ComplaintResponse assignAgent(Long complaintId, Long agentId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        Agent agent = (Agent) userRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found"));

        complaint.setAgent(agent);
        // Only move to ASSIGNED when the complaint hasn't progressed further
        if (complaint.getStatus() == ComplaintStatus.SUBMITTED) {
            complaint.setStatus(ComplaintStatus.ASSIGNED);
        }
        complaint.setUpdatedAt(LocalDateTime.now());
        complaintRepository.save(complaint);

        // Same fix as claim() above — a manager assigning an agent is the
        // other path that can produce ASSIGNED without ever notifying.
        notificationService.notifyStatusChanged(complaint);

        return toResponse(complaint);
    }

    @Override
    public void rate(Long complaintId, RatingRequest request) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        if (complaint.getStatus() != ComplaintStatus.RESOLVED) {
            throw new IllegalStateException("Only resolved complaints can be rated");
        }

        resolutionService.rate(complaintId, request.getScore(), request.getComment());
    }

    private ServiceType parseServiceType(String raw) {
        try {
            return ServiceType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid serviceType '" + raw + "'. Valid values: " + java.util.Arrays.toString(ServiceType.values()));
        }
    }

    private ComplaintStatus parseStatus(String raw) {
        try {
            return ComplaintStatus.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid status '" + raw + "'. Valid values: " + java.util.Arrays.toString(ComplaintStatus.values()));
        }
    }

    private ComplaintResponse toResponse(Complaint c) {
        return new ComplaintResponse(c.getId(), c.getTicketNumber(), c.getType(),
                c.getServiceType().name(), c.getRegion(), c.getCity(), c.getStatus().name(),
                c.getCreatedAt(), c.getUpdatedAt());
    }

    private ComplaintListItemResponse toListItem(Complaint c) {
        return new ComplaintListItemResponse(c.getId(), c.getTicketNumber(), c.getType(),
                c.getServiceType().name(), c.getStatus().name(), c.getRegion(), c.getCreatedAt());
    }

    private ComplaintManagerListItemResponse toManagerListItem(Complaint c) {
        return new ComplaintManagerListItemResponse(
                c.getId(),
                c.getTicketNumber(),
                c.getSubscriber() != null ? c.getSubscriber().getName() : null,
                c.getType(),
                c.getServiceType().name(),
                c.getRegion(),
                c.getCity(),
                c.getStatus().name(),
                c.getCreatedAt(),
                c.getAgent() != null ? c.getAgent().getName() : null);
    }
}
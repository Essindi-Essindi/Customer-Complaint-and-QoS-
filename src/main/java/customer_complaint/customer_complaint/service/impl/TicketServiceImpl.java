package customer_complaint.customer_complaint.service.impl;

import customer_complaint.customer_complaint.model.Complaint;
import customer_complaint.customer_complaint.model.Ticket;
import customer_complaint.customer_complaint.repository.TicketRepository;
import customer_complaint.customer_complaint.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.UUID;

// ticket service impl
@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Override
    public Ticket generateFor(Complaint complaint) {
        Ticket ticket = new Ticket();
        ticket.setComplaint(complaint);
        ticket.setTicketNumber(complaint.getTicketNumber());
        return ticketRepository.save(ticket);
    }

    @Override
    public String nextTicketNumber() {
        String datePart = java.time.LocalDate.now().format(DATE_FORMAT);
        String randomPart = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "TKT-" + datePart + "-" + randomPart;
    }
}

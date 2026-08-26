package customer_complaint.customer_complaint.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

// client setup
// external service call
@FeignClient(name = "smsGatewayClient", url = "${sms.gateway.base-url}")
public interface SmsGatewayClient {

    @PostMapping("/messages")
    void sendSms(@RequestBody SmsRequest request);

    record SmsRequest(String to, String body) {
    }
}

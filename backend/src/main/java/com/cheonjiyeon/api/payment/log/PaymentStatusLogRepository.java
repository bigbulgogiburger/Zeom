package com.cheonjiyeon.api.payment.log;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentStatusLogRepository extends JpaRepository<PaymentStatusLogEntity, Long> {
    List<PaymentStatusLogEntity> findByPaymentIdOrderByIdAsc(Long paymentId);
}

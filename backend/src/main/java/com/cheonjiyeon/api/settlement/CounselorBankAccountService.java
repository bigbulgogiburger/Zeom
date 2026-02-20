package com.cheonjiyeon.api.settlement;

import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.counselor.CounselorBankAccountEntity;
import com.cheonjiyeon.api.counselor.CounselorBankAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.List;

@Service
public class CounselorBankAccountService {

    private final CounselorBankAccountRepository bankAccountRepository;

    public CounselorBankAccountService(CounselorBankAccountRepository bankAccountRepository) {
        this.bankAccountRepository = bankAccountRepository;
    }

    @Transactional
    public CounselorBankAccountEntity register(Long counselorId, String bankCode, String accountNumber, String holderName) {
        // 기존 계좌가 있으면 중복 등록 방지
        List<CounselorBankAccountEntity> existing = bankAccountRepository.findByCounselorId(counselorId);
        if (!existing.isEmpty()) {
            throw new ApiException(409, "이미 등록된 계좌가 있습니다. 수정을 이용해주세요.");
        }

        CounselorBankAccountEntity entity = new CounselorBankAccountEntity();
        entity.setCounselorId(counselorId);
        entity.setBankCode(bankCode);
        entity.setAccountNumberEncrypted(encrypt(accountNumber));
        entity.setHolderName(holderName);
        return bankAccountRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public BankAccountResponse getByCounselorId(Long counselorId) {
        CounselorBankAccountEntity entity = bankAccountRepository
                .findByCounselorIdAndIsPrimary(counselorId, true)
                .orElseThrow(() -> new ApiException(404, "등록된 계좌가 없습니다."));
        return toMaskedResponse(entity);
    }

    @Transactional
    public CounselorBankAccountEntity update(Long counselorId, String bankCode, String accountNumber, String holderName) {
        CounselorBankAccountEntity entity = bankAccountRepository
                .findByCounselorIdAndIsPrimary(counselorId, true)
                .orElseThrow(() -> new ApiException(404, "등록된 계좌가 없습니다."));

        entity.setBankCode(bankCode);
        entity.setAccountNumberEncrypted(encrypt(accountNumber));
        entity.setHolderName(holderName);
        return bankAccountRepository.save(entity);
    }

    @Transactional
    public void delete(Long counselorId) {
        CounselorBankAccountEntity entity = bankAccountRepository
                .findByCounselorIdAndIsPrimary(counselorId, true)
                .orElseThrow(() -> new ApiException(404, "등록된 계좌가 없습니다."));
        bankAccountRepository.delete(entity);
    }

    // --- 계좌번호 암호화/복호화 (Base64, 향후 AES-256 교체 예정) ---

    private String encrypt(String plainAccountNumber) {
        return Base64.getEncoder().encodeToString(plainAccountNumber.getBytes());
    }

    private String decrypt(String encrypted) {
        return new String(Base64.getDecoder().decode(encrypted));
    }

    // --- 마스킹: 마지막 4자리만 표시 ---

    private String mask(String accountNumber) {
        if (accountNumber.length() <= 4) {
            return accountNumber;
        }
        return "*".repeat(accountNumber.length() - 4) + accountNumber.substring(accountNumber.length() - 4);
    }

    private BankAccountResponse toMaskedResponse(CounselorBankAccountEntity entity) {
        String decrypted = decrypt(entity.getAccountNumberEncrypted());
        return new BankAccountResponse(
                entity.getId(),
                entity.getCounselorId(),
                entity.getBankCode(),
                mask(decrypted),
                entity.getHolderName(),
                entity.isPrimary(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public record BankAccountResponse(
            Long id,
            Long counselorId,
            String bankCode,
            String accountNumberMasked,
            String holderName,
            boolean isPrimary,
            java.time.LocalDateTime createdAt,
            java.time.LocalDateTime updatedAt
    ) {}

    public record RegisterRequest(String bankCode, String accountNumber, String holderName) {}

    public record UpdateRequest(String bankCode, String accountNumber, String holderName) {}
}

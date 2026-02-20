CREATE TABLE counselor_bank_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    counselor_id BIGINT NOT NULL,
    bank_code VARCHAR(10) NOT NULL,
    account_number_encrypted VARCHAR(512) NOT NULL,
    holder_name VARCHAR(100) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (counselor_id) REFERENCES counselors(id)
);

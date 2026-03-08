-- 회원가입 보너스 크레딧 시스템
-- wallets 테이블에 보너스 잔액 컬럼 추가
ALTER TABLE wallets ADD COLUMN bonus_balance BIGINT NOT NULL DEFAULT 0;

-- 회원가입 보너스 지급 추적 테이블 (중복 지급 방지)
CREATE TABLE signup_bonuses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  bonus_amount BIGINT NOT NULL,
  granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_signup_bonus_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_signup_bonus_user ON signup_bonuses(user_id);

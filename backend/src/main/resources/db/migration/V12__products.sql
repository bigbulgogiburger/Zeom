CREATE TABLE products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(400),
  minutes INT NOT NULL,
  cash_amount BIGINT NOT NULL,
  price_krw BIGINT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_active ON products(active);

-- Insert default products
INSERT INTO products(name, description, minutes, cash_amount, price_krw, active) VALUES
('기본 상담 (30분)', '30분 실시간 상담', 30, 30000, 33000, TRUE),
('정밀 상담 (60분)', '60분 정밀 상담', 60, 60000, 66000, TRUE),
('프리미엄 상담 (90분)', '90분 심층 상담', 90, 90000, 99000, TRUE);

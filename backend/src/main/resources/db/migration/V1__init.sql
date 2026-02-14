CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  name VARCHAR(60) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE counselors (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  specialty VARCHAR(60) NOT NULL,
  intro VARCHAR(400) NOT NULL
);

CREATE TABLE counselor_slots (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  counselor_id BIGINT NOT NULL,
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP NOT NULL,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_slot_counselor FOREIGN KEY (counselor_id) REFERENCES counselors(id)
);

INSERT INTO counselors(name, specialty, intro) VALUES
('연화당', '연애/재회', '관계 흐름과 타이밍을 현실적으로 짚어드립니다.'),
('천월신녀', '진로/사업', '일·돈·기회운 흐름을 중심으로 방향을 제시합니다.');

INSERT INTO counselor_slots(counselor_id, start_at, end_at, available) VALUES
(1, '2026-02-15 10:00:00', '2026-02-15 10:30:00', TRUE),
(1, '2026-02-15 11:00:00', '2026-02-15 11:30:00', TRUE),
(2, '2026-02-15 14:00:00', '2026-02-15 14:30:00', TRUE);

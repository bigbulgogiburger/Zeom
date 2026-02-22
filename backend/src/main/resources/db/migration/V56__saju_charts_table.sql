-- 사주 명식 캐시 테이블
CREATE TABLE saju_charts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    birth_solar_date DATE NOT NULL,
    birth_hour VARCHAR(10),
    gender VARCHAR(10) NOT NULL,
    year_gan INT NOT NULL,
    year_ji INT NOT NULL,
    month_gan INT NOT NULL,
    month_ji INT NOT NULL,
    day_gan INT NOT NULL,
    day_ji INT NOT NULL,
    hour_gan INT,
    hour_ji INT,
    ohaeng_wood INT DEFAULT 0,
    ohaeng_fire INT DEFAULT 0,
    ohaeng_earth INT DEFAULT 0,
    ohaeng_metal INT DEFAULT 0,
    ohaeng_water INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 만세력 데이터 테이블 (사주 일진 조회용)
CREATE TABLE manseryeok (
    solar_date DATE NOT NULL PRIMARY KEY,
    lunar_year INT NOT NULL,
    lunar_month INT NOT NULL,
    lunar_day INT NOT NULL,
    is_leap_month BOOLEAN DEFAULT FALSE,
    day_gan_index INT NOT NULL,
    day_ji_index INT NOT NULL,
    jeolgi_code VARCHAR(20),
    jeolgi_time TIME
);

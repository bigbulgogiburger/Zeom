CREATE TABLE daily_fortunes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    fortune_date DATE NOT NULL,
    overall_score INT NOT NULL,
    wealth_score INT NOT NULL,
    love_score INT NOT NULL,
    health_score INT NOT NULL,
    overall_text VARCHAR(500),
    wealth_text VARCHAR(300),
    love_text VARCHAR(300),
    health_text VARCHAR(300),
    lucky_color VARCHAR(50),
    lucky_number INT,
    lucky_direction VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, fortune_date),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

package com.cheonjiyeon.api.counselor;

import jakarta.persistence.*;

@Entity
@Table(name = "counselors")
public class CounselorEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 60)
    private String specialty;

    @Column(nullable = false, length = 400)
    private String intro;

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getSpecialty() { return specialty; }
    public String getIntro() { return intro; }
}

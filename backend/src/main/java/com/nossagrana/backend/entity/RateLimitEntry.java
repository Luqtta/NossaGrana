package com.nossagrana.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "rate_limit_entries", indexes = {
    @Index(name = "idx_rate_chave_timestamp", columnList = "chave,timestamp_ms")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RateLimitEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String chave;

    @Column(name = "timestamp_ms", nullable = false)
    private Long timestampMs;

    @PrePersist
    public void prePersist() {
        if (timestampMs == null) timestampMs = Instant.now().toEpochMilli();
    }
}

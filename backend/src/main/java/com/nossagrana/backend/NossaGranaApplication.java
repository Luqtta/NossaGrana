package com.nossagrana.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NossaGranaApplication {

	public static void main(String[] args) {
		SpringApplication.run(NossaGranaApplication.class, args);
	}

}

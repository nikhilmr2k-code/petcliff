package com.petcliff;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PetCliffApplication {
    public static void main(String[] args) {
        SpringApplication.run(PetCliffApplication.class, args);
    }
}

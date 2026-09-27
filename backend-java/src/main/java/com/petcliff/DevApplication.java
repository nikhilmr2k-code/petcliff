package com.petcliff;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.springframework.boot.SpringApplication;

/**
 * Local development entry point. Boots a real Postgres embedded in-process (no Docker),
 * points the datasource at it, activates the "dev" profile (seed data), then starts the app.
 *
 * Production uses {@link PetCliffApplication} with an external RDS via DB_URL/DB_USER/DB_PASSWORD.
 *
 * Run: mvn -q compile exec:java (or java -cp ... com.petcliff.DevApplication)
 */
public class DevApplication {

    public static void main(String[] args) throws Exception {
        EmbeddedPostgres pg = EmbeddedPostgres.builder()
                .setPort(5432)
                .start();

        String jdbcUrl = pg.getJdbcUrl("postgres", "postgres"); // user=postgres, db=postgres
        System.setProperty("DB_URL", jdbcUrl);
        System.setProperty("DB_USER", "postgres");
        System.setProperty("DB_PASSWORD", "postgres");
        System.setProperty("spring.profiles.active", "dev");

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try { pg.close(); } catch (Exception ignored) { }
        }));

        SpringApplication.run(PetCliffApplication.class, args);
    }
}

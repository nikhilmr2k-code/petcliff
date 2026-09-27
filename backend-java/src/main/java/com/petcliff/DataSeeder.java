package com.petcliff;

import com.petcliff.entity.AdminSetting;
import com.petcliff.entity.Product;
import com.petcliff.entity.PromotionCode;
import com.petcliff.repository.AdminSettingRepository;
import com.petcliff.repository.ProductRepository;
import com.petcliff.repository.PromotionCodeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

/**
 * Seeds demo catalog + settings for local dev (profile "dev"). Idempotent: only seeds
 * when the products table is empty. Mirrors the Nov launch catalog from the brief.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    /** slug -> curated Pexels image URL (generated for dev; swap for photoshoot media later). */
    private static final Properties PRODUCT_IMAGES = loadImages();

    private static Properties loadImages() {
        Properties props = new Properties();
        try (InputStream in = DataSeeder.class.getResourceAsStream("/product-images.properties")) {
            if (in != null) props.load(in);
        } catch (Exception e) {
            log.warn("Could not load product-images.properties: {}", e.getMessage());
        }
        return props;
    }

    private final ProductRepository products;
    private final PromotionCodeRepository promos;
    private final AdminSettingRepository settings;

    public DataSeeder(ProductRepository products, PromotionCodeRepository promos, AdminSettingRepository settings) {
        this.products = products;
        this.promos = promos;
        this.settings = settings;
    }

    @Override
    public void run(String... args) {
        if (products.count() == 0) {
            seedProducts();
            log.info("Seeded {} demo products", products.count());
        }
        if (promos.findById("WELCOME10").isEmpty()) {
            PromotionCode p = new PromotionCode();
            p.setCode("WELCOME10");
            p.setKind("percent");
            p.setValue(10);
            p.setActive(true);
            promos.save(p);
            log.info("Seeded promo WELCOME10");
        }
        if (settings.findById("announcement").isEmpty()) {
            AdminSetting s = new AdminSetting();
            s.setKey("announcement");
            Map<String, Object> v = new HashMap<>();
            v.put("enabled", false); // disabled by default per brand guidance
            v.put("text", "FREE US SHIPPING OVER $100 — GIVE $10, GET $10");
            s.setValue(v);
            settings.save(s);
            log.info("Seeded announcement setting (disabled)");
        }
    }

    private void seedProducts() {
        // dog — walking
        add("tactical-harness-set", "Tactical Harness Set", "dog", "walking", "harness", 6800, 8200, "Black");
        add("airtag-padded-harness", "AirTag Padded Harness", "dog", "walking", "harness", 7400, null, "Black");
        add("reflective-front-harness", "Reflective Front Harness", "dog", "walking", "harness", 5900, null, "White");
        add("bungee-reflexive-leash", "Bungee Reflexive Leash", "dog", "walking", "leash", 3800, 4500, "Black");
        add("padded-nylon-leash", "Padded Nylon Leash", "dog", "walking", "leash", 3200, null, "Black");
        add("airtag-reflective-collar", "AirTag & Reflective Collar", "dog", "walking", "collar", 2900, null, "Black");
        // dog — resting
        add("orthopedic-bolster-bed", "Orthopedic Bolster Bed", "dog", "resting", "bed", 12900, 15900, "White");
        // dog — grooming
        add("slicker-brush", "Slicker Brush", "dog", "grooming", "brush", 1900, null, "Black");
        add("stainless-comb", "Stainless Steel Comb", "dog", "grooming", "comb", 1600, null, "Steel");
        add("silicone-toothbrush-set", "Silicone Toothbrush Set", "dog", "grooming", "dental", 1400, null, "White");
        // dog — toys
        add("puzzle-mat", "Enrichment Puzzle Mat", "dog", "toys", "puzzle", 2600, null, "Black");
        add("chew-module", "Chew Module", "dog", "toys", "chew", 1800, null, "Black");
        // dog — accessories
        add("airtag-holder", "AirTag Holder", "dog", "accessories", "airtag", 1200, null, "Black");
        add("dog-goggles", "Dog Goggles", "dog", "accessories", "goggles", 3400, null, "Black");
        add("travel-water-bottle", "Travel Water Bottle", "dog", "accessories", "bottle", 2200, null, "White");
        // cat
        add("cat-reflective-harness-set", "Reflective Harness Set", "cat", "walking", "harness", 4200, null, "Black");
        add("cat-printed-collar", "Printed & Reflective Collar", "cat", "walking", "collar", 1900, null, "White");
        add("cat-wand-teaser", "Wand Teaser Toy", "cat", "toys", "wand", 1500, null, "Black");
    }

    private void add(String slug, String name, String pet, String group, String subtype,
                     int priceCents, Integer compareAtCents, String color) {
        Product p = new Product();
        p.setSlug(slug);
        p.setName(name);
        p.setPetType(pet);
        p.setCategory(group);
        p.setPriceCents(priceCents);
        p.setCompareAtCents(compareAtCents);
        // Curated, product-relevant Pexels photo per slug (placeholder until the custom
        // photoshoot lands). Falls back to a real pet photo if a slug isn't mapped.
        int id = Math.abs(slug.hashCode()) % 100 + 1;
        String fallback = "cat".equalsIgnoreCase(pet)
                ? "https://cataas.com/cat?width=600&height=600&_=" + id
                : "https://placedog.net/600/600?id=" + id;
        p.setImageUrl(PRODUCT_IMAGES.getProperty(slug, fallback));
        p.setDescription(name + " — high-fashion monochrome essentials for pets that thrive.");
        p.setInventoryCount(50);
        Map<String, Object> meta = new HashMap<>();
        meta.put("subtype", subtype);
        meta.put("color", color);
        meta.put("rating", 5);
        p.setMetadata(meta);
        products.save(p);
    }
}

package com.nethink.b2b.config;

import com.cloudinary.Cloudinary;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {

        Map<String, String> config = new HashMap<>();

        config.put("cloud_name", System.getenv("CLOUD_NAME"));
        config.put("api_key", System.getenv("CLOUD_API_KEY"));
        config.put("api_secret", System.getenv("CLOUD_API_SECRET"));

        return new Cloudinary(config);
    }
}
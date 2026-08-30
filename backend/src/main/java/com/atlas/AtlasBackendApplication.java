package com.atlas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class AtlasBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(AtlasBackendApplication.class, args);
	}

}

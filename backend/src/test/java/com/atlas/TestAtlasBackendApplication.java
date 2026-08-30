package com.atlas;

import org.springframework.boot.SpringApplication;

public class TestAtlasBackendApplication {

	public static void main(String[] args) {
		SpringApplication.from(AtlasBackendApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}

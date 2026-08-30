package com.atlas;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class AtlasBackendApplicationTests {
	private final JdbcTemplate jdbcTemplate;
	private final MockMvc mockMvc;

	@Autowired
	AtlasBackendApplicationTests(JdbcTemplate jdbcTemplate, MockMvc mockMvc) {
		this.jdbcTemplate = jdbcTemplate;
		this.mockMvc = mockMvc;
	}

	@Test
	void contextLoads() {
	}

	@Test
	void foundationMigrationEnablesPostgisAndCreatesMetadata() {
		String postgisVersion = jdbcTemplate.queryForObject("SELECT PostGIS_Version()", String.class);
		Integer schemaVersion = jdbcTemplate.queryForObject(
				"SELECT schema_version FROM atlas_schema_metadata WHERE id = 1",
				Integer.class);

		assertThat(postgisVersion).isNotBlank();
		assertThat(schemaVersion).isEqualTo(6);
	}

	@Test
	void safeSystemMetadataAndHealthArePublic() throws Exception {
		mockMvc.perform(get("/api/v1/system/info"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.service").value("atlas-backend"))
				.andExpect(jsonPath("$.apiVersion").value("v1"))
				.andExpect(jsonPath("$.status").value("UP"));

		mockMvc.perform(get("/actuator/health/liveness"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("UP"));

		mockMvc.perform(get("/api-docs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.openapi").isNotEmpty())
				.andExpect(jsonPath("$.paths['/api/v1/auth/login']").exists());
	}

	@Test
	void nonPublicFoundationEndpointIsDenied() throws Exception {
		mockMvc.perform(get("/actuator/prometheus"))
				.andExpect(status().isUnauthorized());
	}

}

package com.atlas.shared.error;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.List;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ApiProblemException.class)
    ProblemDetail handleApiProblem(ApiProblemException exception, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(exception.status(), exception.getMessage());
        problem.setType(URI.create("https://atlas.example/problems/" + exception.code().toLowerCase().replace('_', '-')));
        problem.setTitle(exception.title());
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("code", exception.code());
        problem.setProperty("traceId", traceId());
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "One or more request fields are invalid.");
        problem.setType(URI.create("https://atlas.example/problems/validation-error"));
        problem.setTitle("Validation failed");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("code", "VALIDATION_ERROR");
        problem.setProperty("traceId", traceId());
        problem.setProperty("fieldErrors", fieldErrors(exception));
        return problem;
    }

    private static List<FieldError> fieldErrors(MethodArgumentNotValidException exception) {
        return exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldError(error.getField(), error.getDefaultMessage()))
                .toList();
    }

    private static String traceId() {
        String traceId = MDC.get("traceId");
        return traceId == null ? "unavailable" : traceId;
    }

    record FieldError(String field, String message) {
    }
}

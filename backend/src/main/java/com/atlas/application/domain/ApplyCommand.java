package com.atlas.application.domain;

public record ApplyCommand(
        String coverNote,
        Long proposedRatePence
) {}

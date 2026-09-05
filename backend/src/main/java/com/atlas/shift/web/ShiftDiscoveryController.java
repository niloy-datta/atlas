package com.atlas.shift.web;

import com.atlas.shift.application.ShiftService;
import com.atlas.shift.application.ShiftService.PageResult;
import com.atlas.shift.domain.ShiftDetailView;
import com.atlas.shift.domain.ShiftSummaryView;
import java.time.Instant;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/shifts")
public class ShiftDiscoveryController {
    private final ShiftService shiftService;

    public ShiftDiscoveryController(ShiftService shiftService) {
        this.shiftService = shiftService;
    }

    @GetMapping
    public PageResult<ShiftSummaryView> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false, defaultValue = "25") Double radiusKm,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false) Long minHourlyRatePence,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return shiftService.searchPublicShifts(query, lat, lon, radiusKm, from, to, minHourlyRatePence, page, size);
    }

    @GetMapping("/{shiftId}")
    public ShiftDetailView getShiftDetail(@PathVariable UUID shiftId) {
        return shiftService.getPublicShift(shiftId);
    }
}


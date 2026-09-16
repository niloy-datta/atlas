package com.atlas.worker.web;

import com.atlas.identity.domain.AtlasPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workers/me/earnings")
public class WorkerEarningsController {

    @GetMapping
    public WorkerEarningsView getEarnings(
            @AuthenticationPrincipal AtlasPrincipal principal,
            @RequestParam(name = "currency", defaultValue = "BDT") String currency) {

        boolean isUsd = "USD".equalsIgnoreCase(currency);

        BigDecimal total = isUsd ? new BigDecimal("1280.50") : new BigDecimal("15450.00");
        BigDecimal avgShift = isUsd ? new BigDecimal("45.73") : new BigDecimal("551.78");
        BigDecimal pending = isUsd ? new BigDecimal("220.00") : new BigDecimal("2650.00");
        BigDecimal available = isUsd ? new BigDecimal("320.50") : new BigDecimal("3850.00");
        BigDecimal goalTarget = isUsd ? new BigDecimal("2000.00") : new BigDecimal("24000.00");

        List<MonthlyPoint> monthly = List.of(
                new MonthlyPoint("Jan", isUsd ? 100 : 1200),
                new MonthlyPoint("Feb", isUsd ? 160 : 1950),
                new MonthlyPoint("Mar", isUsd ? 130 : 1580),
                new MonthlyPoint("Apr", isUsd ? 190 : 2300),
                new MonthlyPoint("May", isUsd ? 240 : 2900),
                new MonthlyPoint("Jun", isUsd ? 200 : 2400),
                new MonthlyPoint("Jul", isUsd ? 245 : 2950),
                new MonthlyPoint("Aug", isUsd ? 285 : 3450),
                new MonthlyPoint("Sep", isUsd ? 320 : 3850)
        );

        List<JobTypeRatio> byType = List.of(
                new JobTypeRatio("Warehouse", 32, "#3B82F6"),
                new JobTypeRatio("Cleaning", 24, "#06B6D4"),
                new JobTypeRatio("Hospitality", 18, "#10B981"),
                new JobTypeRatio("Retail", 14, "#F59E0B"),
                new JobTypeRatio("Others", 12, "#64748B")
        );

        List<TransactionItem> transactions = List.of(
                new TransactionItem(UUID.randomUUID().toString(), "14 Sep 2026", "Warehouse Assistant", "Dhanmondi Hub", isUsd ? new BigDecimal("120.00") : new BigDecimal("1450.00"), "Completed"),
                new TransactionItem(UUID.randomUUID().toString(), "12 Sep 2026", "Event Cleaning", "Gulshan Convention", isUsd ? new BigDecimal("80.00") : new BigDecimal("960.00"), "Completed"),
                new TransactionItem(UUID.randomUUID().toString(), "10 Sep 2026", "Restaurant Crew", "The Food Lounge", isUsd ? new BigDecimal("95.50") : new BigDecimal("1150.00"), "Completed"),
                new TransactionItem(UUID.randomUUID().toString(), "08 Sep 2026", "Retail Support", "Bashundhara City", isUsd ? new BigDecimal("70.00") : new BigDecimal("840.00"), "Completed"),
                new TransactionItem(UUID.randomUUID().toString(), "05 Sep 2026", "Warehouse Assistant", "Savar EPZ", isUsd ? new BigDecimal("110.00") : new BigDecimal("1320.00"), "Pending")
        );

        return new WorkerEarningsView(
                currency.toUpperCase(),
                total,
                28,
                avgShift,
                pending,
                available,
                monthly,
                byType,
                transactions,
                new GoalView(goalTarget, total, 64)
        );
    }

    @PostMapping("/withdraw")
    public ResponseEntity<Map<String, Object>> requestWithdrawal(
            @AuthenticationPrincipal AtlasPrincipal principal,
            @Valid @RequestBody WithdrawalRequest request) {

        return ResponseEntity.ok(Map.of(
                "status", "INITIATED",
                "referenceId", "WD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                "amount", request.amount(),
                "method", request.method(),
                "estimatedArrival", "1-2 business days",
                "message", "Withdrawal request received. Funds are being disbursed via " + request.method() + "."
        ));
    }

    public record WorkerEarningsView(
            String currency,
            BigDecimal totalEarnings,
            int completedShifts,
            BigDecimal averagePerShift,
            BigDecimal pendingPayment,
            BigDecimal availableBalance,
            List<MonthlyPoint> monthlyOverview,
            List<JobTypeRatio> earningsByJobType,
            List<TransactionItem> recentTransactions,
            GoalView goal
    ) {}

    public record MonthlyPoint(String month, double amount) {}

    public record JobTypeRatio(String category, int percentage, String colorHex) {}

    public record TransactionItem(String id, String date, String role, String client, BigDecimal amount, String status) {}

    public record GoalView(BigDecimal target, BigDecimal current, int progressPercent) {}

    public record WithdrawalRequest(
            @NotNull @DecimalMin("10.00") BigDecimal amount,
            @NotBlank String method,
            String accountDetails
    ) {}
}

package com.atlas.shared.web;

import com.atlas.identity.domain.AtlasPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/messages")
public class MessageController {

    private final Map<String, List<MessageItem>> threadMessages = new ConcurrentHashMap<>();

    public MessageController() {
        // Initialize sample messages for Sarah Ahmed thread
        List<MessageItem> sarahMessages = new ArrayList<>();
        sarahMessages.add(new MessageItem(
                "m1",
                "other",
                "Sarah Ahmed",
                "Hi Niloy, I came across your profile and I'm impressed with your experience in cleaning and facility support. We have a shift available this weekend at Dhanmondi. Are you interested?",
                "09:12 AM",
                Instant.now().minusSeconds(7200).toString(),
                List.of()
        ));
        sarahMessages.add(new MessageItem(
                "m2",
                "me",
                "Niloy Chandra Datta",
                "Hi Sarah, Yes, I'm interested! Could you please share more details about the shift (time, pay, and location)?",
                "09:18 AM",
                Instant.now().minusSeconds(6600).toString(),
                List.of()
        ));
        sarahMessages.add(new MessageItem(
                "m3",
                "other",
                "Sarah Ahmed",
                "Sure!\n📍 Location: Dhanmondi, Dhaka\n📅 Date: Sat, 20 Sep 2026\n⏰ Time: 8:00 AM – 4:00 PM\n💵 Pay: ৳450/hr (৳3,600 total)\nLet me know if this works for you.",
                "09:22 AM",
                Instant.now().minusSeconds(6000).toString(),
                List.of()
        ));
        sarahMessages.add(new MessageItem(
                "m4",
                "me",
                "Niloy Chandra Datta",
                "That looks good. I'm available. Please confirm my booking.",
                "09:24 AM",
                Instant.now().minusSeconds(5400).toString(),
                List.of()
        ));
        sarahMessages.add(new MessageItem(
                "m5",
                "other",
                "Sarah Ahmed",
                "Great! You're confirmed ✓ You'll receive the full details in your email shortly. Looking forward to working with you!",
                "09:25 AM",
                Instant.now().minusSeconds(4800).toString(),
                List.of()
        ));
        threadMessages.put("thread-1", sarahMessages);
    }

    @GetMapping("/threads")
    public List<ThreadSummary> getThreads(@AuthenticationPrincipal AtlasPrincipal principal) {
        return List.of(
                new ThreadSummary(
                        "thread-1",
                        "Sarah Ahmed",
                        "BrightClean Services",
                        "Operations Manager",
                        "Hi Niloy, are you available for the shift...",
                        "10:24 AM",
                        2,
                        true,
                        "employer",
                        "👩‍💼"
                ),
                new ThreadSummary(
                        "thread-2",
                        "James Carter",
                        "Maple Logistics",
                        "Fleet Supervisor",
                        "Thanks for your interest! We'd like to...",
                        "Yesterday",
                        1,
                        false,
                        "employer",
                        "👨‍💼"
                ),
                new ThreadSummary(
                        "thread-3",
                        "HR Team",
                        "WORVO",
                        "Talent Operations",
                        "Your application for Warehouse Assistant...",
                        "Yesterday",
                        0,
                        true,
                        "system",
                        "🛡️"
                ),
                new ThreadSummary(
                        "thread-4",
                        "TalentMatch AI",
                        "SkillHub",
                        "AI Recruiter",
                        "3 new jobs match your verified skills!",
                        "Sep 14",
                        0,
                        true,
                        "system",
                        "🤖"
                ),
                new ThreadSummary(
                        "thread-5",
                        "Daniel Kim",
                        "QuickServe Restaurant",
                        "Store Manager",
                        "Can you confirm your availability for Friday?",
                        "Sep 14",
                        0,
                        false,
                        "employer",
                        "👨‍🍳"
                )
        );
    }

    @GetMapping("/threads/{threadId}")
    public ThreadDetail getThreadDetail(
            @AuthenticationPrincipal AtlasPrincipal principal,
            @PathVariable("threadId") String threadId) {

        List<MessageItem> messages = threadMessages.getOrDefault(threadId, List.of());
        return new ThreadDetail(
                threadId,
                "Sarah Ahmed",
                "BrightClean Services",
                "Operations Manager",
                "active",
                new RelatedJobInfo(
                        "Cleaning Staff (Weekend Shift)",
                        "Dhanmondi, Dhaka",
                        "Sat, 20 Sep 2026",
                        "8:00 AM – 4:00 PM",
                        "৳450/hr (৳3,600 total)"
                ),
                messages
        );
    }

    @PostMapping("/threads/{threadId}")
    public ResponseEntity<MessageItem> sendMessage(
            @AuthenticationPrincipal AtlasPrincipal principal,
            @PathVariable("threadId") String threadId,
            @Valid @RequestBody SendMessageRequest request) {

        MessageItem newMsg = new MessageItem(
                UUID.randomUUID().toString(),
                "me",
                principal != null && principal.email() != null ? principal.email() : "Niloy Chandra Datta",
                request.content(),
                "Just now",
                Instant.now().toString(),
                List.of()
        );

        threadMessages.computeIfAbsent(threadId, k -> new ArrayList<>()).add(newMsg);
        return ResponseEntity.ok(newMsg);
    }

    public record ThreadSummary(
            String id,
            String name,
            String company,
            String role,
            String lastMessage,
            String timestamp,
            int unreadCount,
            boolean online,
            String type,
            String avatar
    ) {}

    public record ThreadDetail(
            String id,
            String name,
            String company,
            String role,
            String status,
            RelatedJobInfo relatedJob,
            List<MessageItem> messages
    ) {}

    public record RelatedJobInfo(
            String title,
            String location,
            String date,
            String time,
            String pay
    ) {}

    public record MessageItem(
            String id,
            String sender,
            String senderName,
            String content,
            String timeFormatted,
            String isoTimestamp,
            List<String> attachments
    ) {}

    public record SendMessageRequest(
            @NotBlank String content
    ) {}
}

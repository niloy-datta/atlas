import { atlasApi } from "./client";

export interface MessageAttachment {
  name: string;
  size: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  sender: "me" | "them" | "system";
  senderName: string;
  content: string;
  timeFormatted: string;
  isoTimestamp: string;
  attachments?: MessageAttachment[];
}

export interface MessageThread {
  id: string;
  name: string;
  company: string;
  role: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  online: boolean;
  type: "employer" | "system";
  avatar: string;
}

export interface ThreadDetailResponse {
  thread: MessageThread;
  messages: ChatMessage[];
}

export interface SendMessageRequest {
  content: string;
  sender?: string;
  senderName?: string;
}

export async function getMessageThreads(): Promise<MessageThread[]> {
  return atlasApi.get<MessageThread[]>("/api/v1/messages/threads", false);
}

export async function getThreadDetails(threadId: string): Promise<ThreadDetailResponse> {
  return atlasApi.get<ThreadDetailResponse>(`/api/v1/messages/threads/${encodeURIComponent(threadId)}`, false);
}

export async function sendChatMessage(threadId: string, payload: SendMessageRequest): Promise<ChatMessage> {
  return atlasApi.post<ChatMessage>(`/api/v1/messages/threads/${encodeURIComponent(threadId)}`, payload, false);
}

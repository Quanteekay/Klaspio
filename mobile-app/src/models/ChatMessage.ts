export default interface ChatMessage {
  id: string;
  conversationId: string;
  participantIds: string[];
  senderId: string;
  receiverId: string;
  body: string;
  createdAt: string;
  readBy: string[];
}

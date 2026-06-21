import Conversation from "../src/models/conversation.models";

// Helper function to find or create a conversation between two users
export async function findConversation(userId: string, otherId: string) {
    return Conversation.findOne({
        $and: [
            { participants: { $elemMatch: { $eq: userId } } },
            { participants: { $elemMatch: { $eq: otherId } } },
            { $expr: { $eq: [{ $size: "$participants" }, 2] } },
        ]
    } as any);
};
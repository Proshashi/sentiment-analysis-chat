import { insertConversation, insertUser, listUsers } from "./db";

export function seed(): void {
  insertUser({ id: "alex", name: "Alex", avatarColor: "#3B82F6" });
  insertUser({ id: "jamie", name: "Jamie", avatarColor: "#F59E0B" });
  insertConversation({
    id: "conv-1",
    participantA: "alex",
    participantB: "jamie",
    createdAt: Date.now(),
  });
}

if (require.main === module) {
  seed();
  console.log("seeded users:", listUsers());
}

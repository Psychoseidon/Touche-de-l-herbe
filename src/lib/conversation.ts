export function getConversationId(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join("_");
}

# Security Specification for Firestore

## 1. Data Invariants
- Posts must have a valid igId and scheduledAt.
- Only authenticated users can manage their own posts.
- Published status cannot be modified after turning true (terminal state).

## 2. The "Dirty Dozen" Payloads
1. Post with missing `igId`
2. Post with invalid `scheduledAt` format
3. Post attempting to set `published: true` on creation
4. Post by User A trying to update User B's post
5. Post with a 2KB `igId` string (Poisoning)
6. Post with malformed `imageUrl`
7. User A trying to read all posts in `scheduledPosts` (should only see their own)
8. Post updating `token` field (should only be created, not updated)
9. Modifying `createdAt` after creation
10. Setting a future timestamp in the past
11. Attempting to set `published` to false after it was true
12. Attempting to delete a post that is already published

## 3. Test Runner (firestore.rules.test.ts placeholder)
// TODO: Implement using @firebase/rules-unit-testing

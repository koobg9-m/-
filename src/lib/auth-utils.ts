/** 비밀번호를 SHA-256 해시 (브라우저용) */
export async function hashPassword(password: string): Promise<string> {
  const buf = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 비밀번호 검증 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const h = await hashPassword(password);
  return h === storedHash;
}

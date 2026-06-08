export function getEncryptionKey(): string {
  return process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'dev-secret'
}

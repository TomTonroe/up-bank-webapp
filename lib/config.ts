// Configuration and Environment Variables

/**
 * Get the Up Bank API token from environment variables
 * @throws Error if token is not configured
 */
export function getUpBankToken(): string {
  const token = process.env.UP_BANK_API_TOKEN;

  if (!token) {
    throw new Error(
      'UP_BANK_API_TOKEN is not configured. Please create a .env.local file with your Up Bank API token. See .env.example for details.'
    );
  }

  return token;
}

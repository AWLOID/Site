export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: () => requiredEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: () => requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  adminPassword: () => requiredEnv('ADMIN_PASSWORD'),
  authSecret: () => requiredEnv('AUTH_SECRET'),
  rawUserAgentRegex: () => process.env.RAW_USER_AGENT_REGEX?.trim() || ''
};

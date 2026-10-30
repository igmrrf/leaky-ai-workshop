// ✅ EXERCISE 01 solution: fail the build if a secret is about to be inlined.
const PUBLIC_PREFIXES = ['VITE_', 'NEXT_PUBLIC_'];
const SECRET_NAME = /KEY|SECRET|TOKEN|PASSWORD|PRIVATE/i;
const SECRET_VALUE = /sk-[a-zA-Z0-9_-]{16,}/;

export function assertNoSecretsInClientEnv(env: Record<string, string | undefined>): void {
  const offenders = Object.entries(env)
    .filter(([name]) => PUBLIC_PREFIXES.some((p) => name.startsWith(p)))
    .filter(([name, value]) => SECRET_NAME.test(name) || SECRET_VALUE.test(value ?? ''))
    .map(([name]) => name); // names only: never echo the secret into build logs

  if (offenders.length > 0) {
    throw new Error(
      `Refusing to build: ${offenders.join(', ')} would be inlined into the client bundle. ` +
        'Move the secret to the server and call it through the gateway.',
    );
  }
}

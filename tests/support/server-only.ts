// Next's "server-only" package throws when imported outside a React Server
// Component. The lib/ modules import it as a guardrail, so the test config
// aliases it here to keep that guardrail in production while letting the pure
// projection helpers inside those modules be unit tested.
export {};

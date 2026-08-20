/**
 * EduBek — Payment provider registry.
 *
 * A singleton registry that holds one instance of every `PaymentProvider`
 * the platform knows about. The service asks the registry for the provider
 * matching `PaymentRequest.provider` (or the default when none is set).
 *
 * The default provider is the first *configured* provider in registration
 * order — in the sandbox that is always the mock provider because the Stripe
 * env vars are absent.
 */
import type { PaymentProvider, PaymentProviderName, ProviderInfo } from "./types";
import { MockPaymentProvider, StripeProvider } from "./payment-providers";

export class PaymentProviderRegistry {
  private readonly providers = new Map<PaymentProviderName, PaymentProvider>();
  private defaultName: PaymentProviderName | null = null;

  register(provider: PaymentProvider): void {
    this.providers.set(provider.name, provider);
    if (this.defaultName === null) this.defaultName = provider.name;
  }

  get(name: PaymentProviderName): PaymentProvider | undefined {
    return this.providers.get(name);
  }

  list(): PaymentProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Pick the provider for a charge. If the caller named one explicitly, use
   * it (and throw if it isn't configured). Otherwise return the default —
   * which itself must be configured.
   */
  resolve(name?: PaymentProviderName): PaymentProvider {
    if (name) {
      const p = this.providers.get(name);
      if (!p) throw new Error(`Unknown payment provider: ${name}`);
      if (!p.isConfigured()) {
        throw new Error(`Payment provider '${name}' is not configured`);
      }
      return p;
    }
    // Fall back to the first configured provider.
    for (const p of this.providers.values()) {
      if (p.isConfigured()) return p;
    }
    throw new Error("No payment provider is configured");
  }

  info(): ProviderInfo[] {
    return this.list().map((p) => ({
      name: p.name,
      configured: p.isConfigured(),
      isDefault: p.name === this.defaultName,
    }));
  }

  /** For tests / scripts — clear all registrations. */
  reset(): void {
    this.providers.clear();
    this.defaultName = null;
  }
}

// ---------------------------------------------------------------------------
// Singleton bootstrap
// ---------------------------------------------------------------------------

const singleton = new PaymentProviderRegistry();

let bootstrapped = false;
function bootstrap(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  // Order matters: the first configured provider becomes the default.
  singleton.register(new MockPaymentProvider());
  singleton.register(new StripeProvider());
}

/** Access the singleton registry (auto-bootstrapped on first call). */
export function getPaymentRegistry(): PaymentProviderRegistry {
  bootstrap();
  return singleton;
}

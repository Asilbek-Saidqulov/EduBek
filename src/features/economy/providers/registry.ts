import { ProviderCode } from "../types";
import { PaymentProvider } from "./types";
import { ClickProvider } from "./click";
import { ApiError } from "@/lib/errors";

class PaymentProviderRegistry {
  private providers: Map<ProviderCode, PaymentProvider> = new Map();

  constructor() {
    this.registerProvider(new ClickProvider());
  }

  public registerProvider(provider: PaymentProvider): void {
    this.providers.set(provider.providerCode, provider);
  }

  public getProvider(code: ProviderCode): PaymentProvider {
    const provider = this.providers.get(code);
    if (!provider) {
      throw new ApiError(400, `Unsupported payment provider: ${code}`, undefined, undefined, "UNSUPPORTED_PROVIDER");
    }
    return provider;
  }

  public listAvailableProviders(): { code: ProviderCode; name: string; currency: string }[] {
    return [
      { code: "CLICK", name: "Click (Uzbekistan Cards / UZCARD / HUMO)", currency: "UZS" },
    ];
  }
}

export const providerRegistry = new PaymentProviderRegistry();

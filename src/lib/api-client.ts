export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

class ApiClient {
  private formatUrl(url: string, params?: Record<string, any>): string {
    if (!params) return url;
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
    const qs = searchParams.toString();
    return qs ? `${url}${url.includes("?") ? "&" : "?"}${qs}` : url;
  }

  async request<T = any>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    const { params, headers, ...rest } = options;
    const finalUrl = this.formatUrl(url, params);

    const res = await fetch(finalUrl, {
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      ...rest,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error?.message || res.statusText || "Request failed";
      const error = new Error(errorMsg) as any;
      error.status = res.status;
      error.data = data;
      error.code = data?.error?.code;
      throw error;
    }

    return data as T;
  }

  get<T = any>(url: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  post<T = any>(url: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T = any>(url: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T = any>(url: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = any>(url: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient();

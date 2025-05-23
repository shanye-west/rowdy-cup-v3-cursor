import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD
    ? 'https://rowdy-cup-v3-cursor.onrender.com'
    : 'http://localhost:5000');
    
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  console.log('Making API request:', {
    method,
    url: fullUrl,
    data,
    baseUrl,
    env: import.meta.env.VITE_API_URL,
    isProd: import.meta.env.PROD
  });
  
  const res = await fetch(fullUrl, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "Accept": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    mode: "cors",
  });

  console.log('API response:', {
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries())
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD
      ? 'https://rowdy-cup-v3-cursor.onrender.com'
      : 'http://localhost:5000');
      
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    
    console.log('Making query request:', {
      url: fullUrl,
      baseUrl,
      env: import.meta.env.VITE_API_URL,
      isProd: import.meta.env.PROD
    });
    
    const res = await fetch(fullUrl, {
      credentials: "include",
      mode: "cors",
      headers: {
        "Accept": "application/json",
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchOnWindowFocus: false,
      staleTime: 0,
      retry: (failureCount, error: any) => {
        if (error?.status === 401) return false;
        return failureCount < 3;
      },
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: false,
    },
  },
});

// Add global error handler for 401 responses
queryClient.setDefaultOptions({
  queries: {
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
});

// Add global error handler for 401 responses
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.query.state.error?.status === 401) {
    // Clear any potentially invalid session data
    queryClient.setQueryData(["/api/user"], { authenticated: false, user: null });
  }
});

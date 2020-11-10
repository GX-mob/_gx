import { HttpException } from "./exceptions";

export async function request<T = any>(
  uri: string,
  options: RequestInit = {},
): Promise<{ response: Response; content: T }> {
  console.log("b");
  const response = await fetch(uri, options);
  console.log("a");
  const content = await response.json();

  if (!response.ok) {
    throw new HttpException(content);
  }

  return { response, content };
}

export function createAgent(prefix: string, options: RequestInit = {}) {
  const getUri = (endpoint: string) => `${prefix}${endpoint}`;
  const { headers: defaultHeaders, ...defaultOptions } = options;
  return {
    async get<T = any>(endpoint: string, options: RequestInit = {}) {
      const { headers, ...restOptions } = options;
      return request<T>(getUri(endpoint), {
        ...defaultOptions,
        headers: { ...defaultHeaders, ...headers },
        ...restOptions,
      });
    },
    async post<T = any>(
      endpoint: string,
      body: any,
      options: RequestInit = {},
    ) {
      const { headers, ...restOptions } = options;
      return request<T>(getUri(endpoint), {
        method: "POST",
        ...defaultOptions,
        headers: {
          ...defaultHeaders,
          "Content-type": "application/json",
          ...headers,
        },
        ...restOptions,
        body: JSON.stringify(body),
      });
    },
  };
}

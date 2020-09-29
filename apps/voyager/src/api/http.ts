import { HttpException } from "./exceptions";

export async function request(uri: string, options: RequestInit = {}) {
  const response = await fetch(uri, options);
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
    async get(endpoint: string, options: RequestInit = {}) {
      const { headers, ...restOptions } = options;
      return request(getUri(endpoint), {
        ...defaultOptions,
        headers: { ...defaultHeaders, ...headers },
        ...restOptions,
      });
    },
    async post(endpoint: string, body: any, options: RequestInit = {}) {
      const { headers, ...restOptions } = options;
      return request(getUri(endpoint), {
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

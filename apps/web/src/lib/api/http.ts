import { env } from '#/env';

type QueryPrimitive = string | number | boolean;
type QueryValue = QueryPrimitive | null | undefined;

export type QueryParams = Record<string, QueryValue | QueryValue[]>;

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  query?: QueryParams;
  body?: BodyInit | Record<string, unknown> | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

const API_BASE_URL = `${env.VITE_API_URL.replace(/\/$/, '')}${env.VITE_API_BASE_PATH}`;

const isPlainObjectBody = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (
    !(value instanceof Blob) &&
    !(value instanceof FormData) &&
    !(value instanceof URLSearchParams) &&
    !(value instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(value)
  );
};

const appendQueryValue = (searchParams: URLSearchParams, key: string, value: QueryValue) => {
  if (value === null || value === undefined) {
    return;
  }

  searchParams.append(key, String(value));
};

const createUrl = (path: string, query?: QueryParams) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (!query) {
    return url;
  }

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        appendQueryValue(url.searchParams, key, item);
      }
      continue;
    }

    appendQueryValue(url.searchParams, key, value);
  }

  return url;
};

const readResponseBody = async (response: Response) => {
  const bodyText = await response.text();

  if (!bodyText) {
    return null;
  }

  try {
    return JSON.parse(bodyText) as unknown;
  } catch {
    return bodyText;
  }
};

const getPayloadMessage = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const message = (payload as { message?: unknown }).message;
  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
    return message.join(', ');
  }

  return undefined;
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  return getPayloadMessage(error.data) ?? error.message;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { query, body, headers, ...rest } = options;

  const requestHeaders = new Headers(headers ?? {});
  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', 'application/json');
  }

  let requestBody: BodyInit | null | undefined = body;
  if (isPlainObjectBody(body)) {
    requestBody = JSON.stringify(body);
    if (!requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json');
    }
  }

  const response = await fetch(createUrl(path, query), {
    credentials: 'include',
    ...rest,
    headers: requestHeaders,
    body: requestBody,
  });

  const payload = await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText || 'API request failed', payload);
  }

  if (response.status === 204 || payload === null) {
    return undefined as T;
  }

  return payload as T;
}

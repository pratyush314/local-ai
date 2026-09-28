import { z } from 'zod';

import { ApiError } from './apiError';
import { buildApiUrl } from './apiUrl';

type RequestOptions<
	TResponseSchema extends z.ZodTypeAny,
	TBodySchema extends z.ZodTypeAny | undefined = undefined,
> = {
	path: string;
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	body?: TBodySchema extends z.ZodTypeAny
		? z.input<TBodySchema> | FormData
		: FormData | undefined;
	bodySchema?: TBodySchema;
	responseSchema: TResponseSchema;
	headers?: HeadersInit;
	signal?: AbortSignal;
	credentials?: RequestCredentials;
	params?: Record<string, unknown>;
};

async function parseResponseBody(response: Response): Promise<unknown> {
	const contentType = response.headers.get('content-type') ?? '';

	if (contentType.includes('application/json')) {
		return response.json().catch(() => null);
	}

	if (contentType.includes('text/')) {
		return response.text().catch(() => null);
	}

	return null;
}

export async function apiClient<
	TResponseSchema extends z.ZodTypeAny,
	TBodySchema extends z.ZodTypeAny | undefined = undefined,
>({
	path,
	method = 'GET',
	body,
	bodySchema,
	responseSchema,
	headers,
	signal,
	credentials = 'include',
	params,
}: RequestOptions<TResponseSchema, TBodySchema>): Promise<
	z.infer<TResponseSchema>
> {
	const url = buildApiUrl(path, params);

	const isFormData = body instanceof FormData;

	const requestHeaders = new Headers(headers);

	if (!isFormData && !requestHeaders.has('Content-Type')) {
		requestHeaders.set('Content-Type', 'application/json');
	}

	let requestBody: BodyInit | undefined;

	if (isFormData) {
		requestBody = body;
	} else if (body !== undefined) {
		const validatedBody = bodySchema ? bodySchema.parse(body) : body;

		requestBody = JSON.stringify(validatedBody);
	}

	const response = await fetch(url, {
		method,
		headers: requestHeaders,
		body: requestBody,
		credentials,
		signal,
	});

	const responseData = await parseResponseBody(response);

	if (!response.ok) {
		const message =
			typeof responseData === 'object' &&
			responseData !== null &&
			'message' in responseData &&
			typeof responseData.message === 'string'
				? responseData.message
				: `Request failed with status ${response.status}`;

		throw new ApiError(message, response.status, responseData);
	}

	try {
		return responseSchema.parse(responseData);
	} catch (error) {
		throw new ApiError('Invalid response schema', response.status, error);
	}
}

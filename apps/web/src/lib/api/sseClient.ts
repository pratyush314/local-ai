import { z } from 'zod';

import { ApiError } from './apiError';
import { buildApiUrl } from './apiUrl';

interface SseRequestOptions<TBodySchema extends z.ZodTypeAny | undefined> {
	path: string;
	method?: 'POST' | 'PUT' | 'PATCH';
	body?: TBodySchema extends z.ZodTypeAny ? z.input<TBodySchema> : undefined;
	bodySchema?: TBodySchema;
	headers?: HeadersInit;
	signal?: AbortSignal;
	credentials?: RequestCredentials;
	params?: Record<string, unknown>;
}

export async function* sseClient<
	TEventSchema extends z.ZodTypeAny,
	TBodySchema extends z.ZodTypeAny | undefined = undefined,
>(
	options: SseRequestOptions<TBodySchema> & {
		eventSchema: TEventSchema;
	},
): AsyncGenerator<z.infer<TEventSchema>> {
	const {
		path,
		method = 'POST',
		body,
		bodySchema,
		headers,
		signal,
		credentials = 'include',
		params,
		eventSchema,
	} = options;

	const url = buildApiUrl(path, params);

	const requestHeaders = new Headers(headers);

	requestHeaders.set('Accept', 'text/event-stream');

	if (!requestHeaders.has('Content-Type')) {
		requestHeaders.set('Content-Type', 'application/json');
	}

	let requestBody: BodyInit | undefined;

	if (body !== undefined) {
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

	if (!response.ok) {
		const contentType = response.headers.get('content-type') ?? '';

		let responseData: unknown = null;

		if (contentType.includes('application/json')) {
			responseData = await response.json().catch(() => null);
		} else {
			responseData = await response.text().catch(() => null);
		}

		const message =
			typeof responseData === 'object' &&
			responseData !== null &&
			'message' in responseData &&
			typeof responseData.message === 'string'
				? responseData.message
				: `Request failed with status ${response.status}`;

		throw new ApiError(message, response.status, responseData);
	}

	if (!response.body) {
		throw new ApiError(
			'The server returned an empty response body',
			response.status,
		);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();

	let buffer = '';

	try {
		while (true) {
			const { value, done } = await reader.read();

			if (done) {
				break;
			}

			buffer += decoder.decode(value, { stream: true });

			const events = buffer.split('\n\n');

			buffer = events.pop() ?? '';

			for (const event of events) {
				const data = extractSseData(event);

				if (data === null) {
					continue;
				}

				let parsedData: unknown;

				try {
					parsedData = JSON.parse(data);
				} catch {
					throw new ApiError(
						'Invalid SSE event payload',
						response.status,
						data,
					);
				}

				yield eventSchema.parse(parsedData);
			}
		}

		buffer += decoder.decode();

		if (buffer.trim()) {
			const data = extractSseData(buffer);

			if (data !== null) {
				const parsedData = JSON.parse(data);
				yield eventSchema.parse(parsedData);
			}
		}
	} finally {
		reader.releaseLock();
	}
}

function extractSseData(event: string): string | null {
	const lines = event.split(/\r?\n/);

	const dataLines = lines
		.filter((line) => line.startsWith('data:'))
		.map((line) => line.slice(5).trimStart());

	if (dataLines.length === 0) {
		return null;
	}

	return dataLines.join('\n');
}

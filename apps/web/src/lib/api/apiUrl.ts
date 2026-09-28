import { env } from '@/lib/env';

function trimSlashes(value: string) {
	return value.replace(/^\/+|\/+$/g, '');
}

export function buildApiUrl(path: string, params?: Record<string, unknown>) {
	const baseUrl = trimSlashes(env.NEXT_PUBLIC_API_URL);
	const endpoint = trimSlashes(path);

	const url = new URL(`${baseUrl}/${endpoint}`);

	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value === undefined || value === null || value === '') {
				return;
			}

			url.searchParams.set(key, String(value));
		});
	}

	return url.toString();
}

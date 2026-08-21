export function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

export function truncateString(value: string, maxLength: number): string {
	if (value.length <= maxLength) {
		return value;
	}

	return `${value.slice(0, maxLength)}...`;
}

export type ApiError = { code: string; message: string };
export type ApiResponse<T> = { data: T };

export function ok<T>(data: T): ApiResponse<T> {
	return { data };
}

export function error(code: string, message: string): { error: ApiError } {
	return { error: { code, message } };
}

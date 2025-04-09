// src/common/responses/api-response.ts

export class ApiResponse<T> {
    statusCode: number;
    message: string;
    data: T;
    timestamp: string;
    path: string;

    constructor(data: T, statusCode = 200, message = 'success', path = '') {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.timestamp = new Date().toISOString();
        this.path = path;
    }

    static success<T>(data: T, message = 'success', path = ''): ApiResponse<T> {
        return new ApiResponse<T>(data, 200, message, path);
    }

    // Modifier cette méthode pour gérer undefined correctement
    static error<T>(statusCode: number, message: string, path = '', data?: T): ApiResponse<T | null> {
        // Utiliser null au lieu de undefined pour le data
        return new ApiResponse<T | null>(data ?? null, statusCode, message, path);
    }
}
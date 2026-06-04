"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaginatedResponse = exports.createErrorResponse = exports.createSuccessResponse = void 0;
// Export success helper
const createSuccessResponse = (data, message = 'Success', statusCode = 200) => ({
    success: true,
    message,
    data,
    statusCode,
});
exports.createSuccessResponse = createSuccessResponse;
// Export error helper
const createErrorResponse = (message, error, statusCode = 400) => ({
    success: false,
    message,
    error,
    statusCode,
});
exports.createErrorResponse = createErrorResponse;
// Export paginated response helper
const createPaginatedResponse = (data, total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
};
exports.createPaginatedResponse = createPaginatedResponse;

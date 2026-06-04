// Pagination Request DTO
export interface PaginationDTO {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Pagination Response DTO
export interface PaginatedResponseDTO<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// API Response DTO
export interface ApiResponseDTO<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode: number;
}

// Bulk Action Response DTO
export interface BulkActionResponseDTO {
  success: number;
  failed: number;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

// Search Query DTO
export interface SearchQueryDTO {
  query: string;
  fields?: string[];
  limit?: number;
}

// Filter and Search DTO
export interface FilterSearchDTO {
  filters?: Record<string, any>;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Export success helper
export const createSuccessResponse = <T>(
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): ApiResponseDTO<T> => ({
  success: true,
  message,
  data,
  statusCode,
});

// Export error helper
export const createErrorResponse = (
  message: string,
  error?: string,
  statusCode: number = 400
): ApiResponseDTO => ({
  success: false,
  message,
  error,
  statusCode,
});

// Export paginated response helper
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponseDTO<T> => {
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

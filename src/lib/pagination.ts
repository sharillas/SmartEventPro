import { prisma } from "@/lib/prisma";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: string | null;
  limit?: string | null;
  search?: string | null;
}

export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, parseInt(params.page || "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit || "10") || 10));
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

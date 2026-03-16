export interface PaginationOptions {
  page: number;
  limit: number;
}

export function getPagination(page = 1, limit = 10): PaginationOptions {
  return { page, limit };
}

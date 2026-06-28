export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER: 'asc' | 'desc' = 'desc';

export const calculatePagination = (query: PaginationQuery): PaginationOptions => {
  const page = Math.max(Number(query.page) || DEFAULT_PAGE, 1);
  const limit = Math.max(Number(query.limit) || DEFAULT_LIMIT, 1);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || DEFAULT_SORT_BY;
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : DEFAULT_SORT_ORDER;

  return { page, limit, skip, sortBy, sortOrder };
};

export const buildMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

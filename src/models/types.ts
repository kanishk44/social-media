// User types
export interface UserDTO {
  id: string;
  handle: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface UserPublicDTO {
  id: string;
  handle: string;
  name: string;
  createdAt: Date;
}

// Post types
export interface PostDTO {
  id: string;
  text: string;
  mediaUrl: string | null;
  createdAt: Date;
  author: UserPublicDTO;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
}

// Common response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}


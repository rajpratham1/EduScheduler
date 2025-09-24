export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: any): never => {
  if (error.response) {
    // Server responded with an error status
    throw new ApiError(
      error.response.status,
      error.response.data.message || 'An error occurred',
      error.response.data
    );
  } else if (error.request) {
    // Request was made but no response received
    throw new ApiError(
      503,
      'Unable to connect to the server'
    );
  } else {
    // Something else went wrong
    throw new ApiError(
      500,
      error.message || 'An unexpected error occurred'
    );
  }
};

export const isApiError = (error: any): error is ApiError => {
  return error instanceof ApiError;
};
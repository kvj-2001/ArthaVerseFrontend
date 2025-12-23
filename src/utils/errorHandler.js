/**
 * Utility function to extract error messages from axios error responses
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (error.response) {
    // Server responded with error status
    const { data } = error.response;
    
    // Check for validation errors first
    if (data.validationErrors) {
      const validationMessages = Object.values(data.validationErrors);
      return validationMessages.length > 0 ? validationMessages.join(', ') : defaultMessage;
    }
    
    // Check for general error message
    if (data.message) {
      return data.message;
    }
    
    // Fallback to status text
    if (error.response.statusText) {
      return error.response.statusText;
    }
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error - please check your connection';
  } else if (error.message) {
    // Something else happened
    return error.message;
  }
  
  return defaultMessage;
};

/**
 * Utility function to handle common axios errors and show appropriate toasts
 */
export const handleApiError = (error, toast, defaultMessage = 'An error occurred') => {
  const message = getErrorMessage(error, defaultMessage);
  toast.error(message);
  return message;
};

// src/utils/ApiResponse.js
// A standard response wrapper.
// WHY: Ensures every successful API response has the same shape.
// Frontend always knows it will get: { success, message, data }

class ApiResponse {
  constructor(statusCode, message, data = null) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };

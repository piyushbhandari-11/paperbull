// src/middlewares/validate.js
// Joi validation middleware factory.
// Usage: router.post('/orders', validate(orderSchema), controller)
// WHY: Validation happens BEFORE the controller runs.
// Invalid input is rejected early without hitting the DB.

import { ApiError } from "../utils/ApiError.js";

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message);
    throw new ApiError(400, messages.join(", "));
  }
  next();
};

export { validate };

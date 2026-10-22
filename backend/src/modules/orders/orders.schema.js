// src/modules/orders/orders.schema.js
// Joi validation for placing an order.

import Joi from "joi";

const placeOrderSchema = Joi.object({
  symbol: Joi.string().uppercase().min(1).max(20).required(),
  side: Joi.string().valid("BUY", "SELL").required(),
  order_type: Joi.string().valid("MARKET", "LIMIT").required(),
  quantity: Joi.number().integer().min(1).required(),

  // price is required only for LIMIT orders
  // Joi's .when() lets us express conditional rules
  price: Joi.when("order_type", {
    is: "LIMIT",
    then: Joi.number().positive().required().messages({
      "any.required": "price is required for LIMIT orders",
    }),
    otherwise: Joi.number().positive().optional(), // ignored for MARKET
  }),
});

const cancelOrderSchema = Joi.object({
  // params validated separately — no body needed for cancel
});

export { placeOrderSchema, cancelOrderSchema };

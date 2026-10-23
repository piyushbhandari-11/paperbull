// src/modules/transactions/transactions.controller.js
// HTTP controller for financial transactions.

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as transactionsService from "./transactions.service.js";

const getUserTransactions = asyncHandler(async (req, res) => {
  const transactions = await transactionsService.getUserTransactions(req.user.id);
  res.status(200).json(new ApiResponse(200, "Transactions fetched", transactions));
});

export { getUserTransactions };

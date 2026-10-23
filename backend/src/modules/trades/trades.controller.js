// src/modules/trades/trades.controller.js
// HTTP controller for trade history endpoints.

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as tradesService from "./trades.service.js";

const getUserTrades = asyncHandler(async (req, res) => {
  const trades = await tradesService.getUserTrades(req.user.id);
  res.status(200).json(new ApiResponse(200, "Trade history fetched", trades));
});

const getMarketTrades = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
  const trades = await tradesService.getMarketTrades(limit);
  res.status(200).json(new ApiResponse(200, "Market trades fetched", trades));
});

export { getUserTrades, getMarketTrades };

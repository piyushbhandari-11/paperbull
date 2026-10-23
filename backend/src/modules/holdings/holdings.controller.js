// src/modules/holdings/holdings.controller.js

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as holdingsService from "./holdings.service.js";

const getHoldings = asyncHandler(async (req, res) => {
  const holdings = await holdingsService.getHoldings(req.user.id);
  res.status(200).json(new ApiResponse(200, "Holdings fetched", holdings));
});

export { getHoldings };

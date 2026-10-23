// src/modules/portfolio/portfolio.controller.js

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as portfolioService from "./portfolio.service.js";

const getPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await portfolioService.getPortfolio(req.user.id);
  res.status(200).json(new ApiResponse(200, "Portfolio fetched", portfolio));
});

export { getPortfolio };

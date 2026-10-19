// src/modules/users/users.controller.js

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as usersService from "./users.service.js";

const getMe = asyncHandler(async (req, res) => {
  const user = await usersService.getMe(req.user.id);
  res.status(200).json(new ApiResponse(200, "User profile fetched", user));
});

export { getMe };

import { BadRequestError } from "../../utils/errors.js";
import {
  requireFields,
  sanitizeBody,
  validateTextMaxLengths,
} from "./helpers.js";
import {
  isStrongPasswordValue,
  PASSWORD_POLICY_MESSAGE,
} from "../../utils/passwordPolicy.js";

export const validateUpdateProfile = [
  sanitizeBody("firstname", "lastname", "username"),
  validateTextMaxLengths({
    firstname: 100,
    lastname: 100,
    username: 50,
  }),
  (req, _res, next) => {
    const { firstname, lastname, username } = req.body;

    if (
      firstname === undefined &&
      lastname === undefined &&
      username === undefined
    ) {
      return next(
        new BadRequestError("At least one field is required for update")
      );
    }

    if (username !== undefined && username === "") {
      return next(new BadRequestError("Username cannot be empty"));
    }

    next();
  },
];

export const validateChangePassword = [
  requireFields("currentPassword", "newPassword"),
  (req, _res, next) => {
    const { newPassword } = req.body;
    if (typeof newPassword !== "string" || !isStrongPasswordValue(newPassword)) {
      return next(new BadRequestError(`New ${PASSWORD_POLICY_MESSAGE.toLowerCase()}`));
    }
    next();
  },
];
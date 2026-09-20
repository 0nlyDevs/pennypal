import bcrypt from "bcrypt";
import { prisma } from "../db/prisma.js";
import { revokeAllSessionTokens } from "./session.service.js";
import { publicUserSelect } from "../utils/userSelect.js";
import { NotFoundError, UnauthorizedError } from "../utils/errors.js";

export const updateUserProfile = async (userId, { firstname, lastname, username }) => {
  const user = await prisma.user.update({
    where: { user_id: userId },
    data: {
      firstname: firstname || undefined,
      lastname: lastname || undefined,
      username: username || undefined,
    },
    select: publicUserSelect,
  });
  return user;
};

export const changeUserPassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { user_id: userId } });
  if (!user) throw new NotFoundError("User not found");

  const ok = await bcrypt.compare(currentPassword, user.hashed_password);
  if (!ok) throw new UnauthorizedError("Current password is incorrect");

  const hashed_password = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { user_id: userId },
    data: { hashed_password },
  });
  await revokeAllSessionTokens(userId);

  return { message: "Password updated successfully" };
};
export default () => {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "Missing DATABASE_URL. Copy server/.env.test.example to server/.env.test."
    );
  }
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET in test environment.");
  }
};
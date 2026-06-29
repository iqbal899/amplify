import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function generateToken(creatorId: number) {
  return jwt.sign(
    {
      creatorId,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
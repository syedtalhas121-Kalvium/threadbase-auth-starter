import jwt from "jsonwebtoken";

/**
 * Verify the Bearer access token and expose its payload as req.user.
 * Missing, malformed, invalid, and expired tokens all return 401.
 */
export default function verifyToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Bearer token required" });
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Bearer token required" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: invalid or expired token" });
  }
}

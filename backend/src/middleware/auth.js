import jwt from 'jsonwebtoken';

function secret() {
  return process.env.JWT_SECRET || 'gst-invoice-dev-secret';
}

export function signToken(company) {
  return jwt.sign(
    { id: company.id, email: company.email },
    secret(),
    { expiresIn: '7d' }
  );
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(header.slice(7), secret());
    req.companyId = payload.id;
    req.companyEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

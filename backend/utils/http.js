const getCorsHeaders = () => ({
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
});

const applyCorsHeaders = (res) => {
  const headers = getCorsHeaders();

  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
};

const sendJson = (res, statusCode, payload) => {
  applyCorsHeaders(res);
  return res.status(statusCode).json(payload);
};

const handleOptions = (res) => {
  applyCorsHeaders(res);
  return res.status(204).end();
};

module.exports = {
  applyCorsHeaders,
  sendJson,
  handleOptions,
};
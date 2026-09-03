export default async function handler(req, res) {
  const path = Array.isArray(req.query.path)
    ? req.query.path.join("/")
    : req.query.path || "";

  const targetUrl = `https://churchattendance.rf.gd/api/${path}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        Accept: "application/json",
        "Content-Type": req.headers["content-type"] || "application/json",
      },
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : JSON.stringify(req.body),
    });

    const data = await response.text();

    res.status(response.status);
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/json"
    );

    res.send(data);
  } catch (error) {
    console.error("API proxy error:", error);

    res.status(500).json({
      error: "API proxy failed",
      message: error.message,
    });
  }
}
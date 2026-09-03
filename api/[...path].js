export default async function handler(req, res) {
  const path = req.query.path || [];
  const apiPath = path.join("/");

  const targetUrl = `https://churchattendance.rf.gd/api/${apiPath}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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
    res.status(500).json({
      error: "API proxy failed",
      message: error.message,
    });
  }
}
export default async function handler(request) {
  const url = new URL(request.url);

  const apiPath = url.pathname.replace(/^\/api/, "");

  const targetUrl = `https://churchattendance.rf.gd/api${apiPath}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        Accept: "application/json",
        "Content-Type":
          request.headers.get("content-type") || "application/json",
      },
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.text(),
    });

    return new Response(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "API proxy failed",
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
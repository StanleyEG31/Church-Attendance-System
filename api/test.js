export default function handler(request, response) {
  response.status(200).json({
    success: true,
    message: "Vercel API function is working!"
  });
}
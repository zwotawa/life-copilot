export default function handler(req, res) {
  const key = (process.env.AZURE_API_KEY || "").trim();
  res.status(200).json({
    hasKey: !!key,
    keyLen: key.length,
    hasBaseUrl: !!process.env.AZURE_API_BASE_URL
  });
}
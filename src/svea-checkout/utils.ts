export const generateSveaAuthHeader = async (
  merchantId: string,
  secret: string,
  body: string,
  timestamp: string
) => {
  // 1. Concatenate: body + secret + timestamp
  const message = body + secret + timestamp;

  // 2. Create SHA-512 Hash
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);

  // 3. Convert Hash to Uppercase Hex String
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  // 4. Create Token: Base64(merchantId + ":" + hashHex)
  const tokenString = `${merchantId}:${hashHex}`;
  const token = btoa(tokenString);

  return `Svea ${token}`;
};

export const getFormattedTimestamp = () => {
  // Format: YYYY-MM-DD HH:mm:ss (UTC)
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
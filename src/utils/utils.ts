export function objectDeepCopy(obj: any, keysToExclude: string[] = []): any {
  if (typeof obj !== "object" || obj === null) {
    return obj; // Return non-objects as is
  }

  const copiedObject: Record<string, any> = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !keysToExclude.includes(key)) {
      copiedObject[key] = obj[key];
    }
  }

  return copiedObject;
}

const ReferralCodeBase =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function decodechatId(encoded: string) {
  const baseLength = ReferralCodeBase.length;

  let decoded = 0;
  const reversed = encoded.split("").reverse().join("");

  for (let i = 0; i < reversed.length; i++) {
    const char = reversed[i];
    const charValue = ReferralCodeBase.indexOf(char);
    decoded += charValue * Math.pow(baseLength, i);
  }

  return decoded.toString();
}
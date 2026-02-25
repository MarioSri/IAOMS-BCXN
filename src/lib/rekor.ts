export async function submitToRekor(data: unknown): Promise<{ uuid: string; logIndex: number }> {
  const payload = {
    kind: 'hashedrekord',
    apiVersion: '0.0.1',
    spec: {
      data: {
        hash: {
          algorithm: 'sha256',
          value: await hashData(JSON.stringify(data))
        }
      }
    }
  };

  const response = await fetch('https://rekor.sigstore.dev/api/v1/log/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Rekor submission failed: ${response.statusText}`);
  }

  const result = await response.json();
  const uuid = Object.keys(result)[0];
  const entry = result[uuid];

  return {
    uuid,
    logIndex: entry.logIndex
  };
}

async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

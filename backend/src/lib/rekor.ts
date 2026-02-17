import axios from 'axios';
import crypto from 'crypto';

interface RekorEntry {
    uuid: string;
    logIndex: number;
    body: string;
    integratedTime: number;
}

export async function submitToRekor(data: any): Promise<{ uuid: string; logIndex: number }> {
    const jsonData = JSON.stringify(data);
    const hash = crypto.createHash('sha256').update(jsonData).digest('hex');

    const payload = {
        kind: 'hashedrekord',
        apiVersion: '0.0.1',
        spec: {
            data: {
                hash: {
                    algorithm: 'sha256',
                    value: hash
                }
            }
        }
    };

    try {
        const response = await axios.post('https://rekor.sigstore.dev/api/v1/log/entries', payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const result = response.data;
        const uuid = Object.keys(result)[0];
        const entry = result[uuid];

        return {
            uuid,
            logIndex: entry.logIndex
        };
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Rekor submission failed: ${error.response?.statusText || error.message}`);
        }
        throw error;
    }
}

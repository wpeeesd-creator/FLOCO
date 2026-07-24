const BASE = 'https://safeguard-api.wenit.ai/api/portal/moderation';
const API_KEY = process.env.EXPO_PUBLIC_WENIT_KEY ?? '';

const MAX_POLL = 15; // 최대 15초 대기

async function submitCheck(text: string): Promise<string> {
  const form = new FormData();
  form.append('prompt', text);

  const res = await fetch(`${BASE}/check`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
    body: form,
  });

  if (!res.ok) throw new Error(`safeguard submit failed: ${res.status}`);
  const json = await res.json();
  console.log('[safeguard] submitCheck response:', JSON.stringify(json)); // TODO: 디버그용 임시 로그
  return json.data.task_id;
}

async function pollResult(taskId: string): Promise<'safe' | 'review' | 'block'> {
  for (let i = 0; i < MAX_POLL; i++) {
    const res = await fetch(`${BASE}/check/${taskId}`, {
      headers: { 'X-API-Key': API_KEY },
    });
    if (!res.ok) throw new Error(`safeguard poll failed: ${res.status}`);

    const json = await res.json();
    console.log(`[safeguard] pollResult attempt ${i + 1}/${MAX_POLL}:`, JSON.stringify(json)); // TODO: 디버그용 임시 로그
    const data = json.data ?? json;

    if (data.status === 'completed' || data.status === 'failed') {
      const result = data.result;
      if (result === 'safe' || result === 'review' || result === 'block') return result;
      return 'review'; // 알 수 없는 값 → 검토로
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return 'review'; // 타임아웃 → 검토로
}

export async function moderateText(text: string): Promise<'safe' | 'review' | 'block'> {
  try {
    const taskId = await submitCheck(text);
    return await pollResult(taskId);
  } catch {
    return 'review'; // API 오류 → fail-closed (검토)
  }
}

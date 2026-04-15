// infra/flack/flackClient.js
async function ensureDM(userA, userB) {

  console.log('Ensuring DM between:', userA, userB);
  try {
    const res = await fetch('http://localhost:3001/ensure-dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userA, userB }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    return await res.json();
  } catch (err) {
    console.error('ensureDM failed:', err.message);
  }
}

module.exports = { ensureDM };

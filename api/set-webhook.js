const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export default async function handler(req, res) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return res.status(500).json({
        ok: false,
        error: 'TELEGRAM_BOT_TOKEN topilmadi',
      });
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = 'https';
    const webhookUrl = `${protocol}://${host}/api/bot`;

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
        }),
      }
    );

    const data = await response.json();

    return res.status(200).json({
      ok: true,
      webhookUrl,
      telegram: data,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || 'unknown error',
    });
  }
}

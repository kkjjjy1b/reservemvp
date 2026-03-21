export type MailMessage = {
  to: string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  idempotencyKey?: string;
};

export type MailSendResult =
  | {
      status: "sent";
      provider: string;
      messageId?: string;
    }
  | {
      status: "skipped";
      provider: string;
      reason: string;
    };

export interface MailProvider {
  readonly name: string;
  isConfigured(): boolean;
  send(message: MailMessage): Promise<MailSendResult>;
}

class NoopMailProvider implements MailProvider {
  readonly name = "noop";

  isConfigured() {
    return false;
  }

  async send(): Promise<MailSendResult> {
    return {
      status: "skipped",
      provider: this.name,
      reason: "mail provider is not configured",
    };
  }
}

class ResendMailProvider implements MailProvider {
  readonly name = "resend";

  isConfigured() {
    return Boolean(
      process.env.RESEND_API_KEY?.trim() &&
        process.env.RESEND_FROM_EMAIL?.trim(),
    );
  }

  async send(message: MailMessage): Promise<MailSendResult> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.RESEND_FROM_EMAIL?.trim();

    if (!apiKey || !from) {
      return {
        status: "skipped",
        provider: this.name,
        reason: "RESEND_API_KEY or RESEND_FROM_EMAIL is missing",
      };
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(message.idempotencyKey
          ? {
              "Idempotency-Key": message.idempotencyKey,
            }
          : {}),
      },
      body: JSON.stringify({
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        reply_to: message.replyTo,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`RESEND_MAIL_FAILED:${response.status}:${errorText}`);
    }

    const payload = (await response.json().catch(() => null)) as
      | { id?: string }
      | null;

    return {
      status: "sent",
      provider: this.name,
      messageId: payload?.id,
    };
  }
}

let cachedProvider: MailProvider | null = null;

export function getMailProvider(): MailProvider {
  if (!cachedProvider) {
    cachedProvider = new ResendMailProvider();
  }

  return cachedProvider.isConfigured() ? cachedProvider : new NoopMailProvider();
}

export function isInsufficientCreditsError(msg: string) {
  return /insufficient|credit|balance|402|payment required/i.test(msg);
}

export function CreditsErrorCard() {
  return (
    <div className="credits-error-card">
      <div className="credits-error-title">Insufficient Balance</div>
      <div className="credits-error-body">
        Your account does not have enough credits to process this request.
        Please top up your OpenRouter account and try again.
      </div>
      <a
        className="credits-topup-link"
        href="https://openrouter.ai/credits"
        target="_blank"
        rel="noopener noreferrer"
      >
        Top up on OpenRouter →
      </a>
    </div>
  );
}
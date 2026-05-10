import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getCredits,
  submitContactMessage,
  handleTranslate,
  ContactApiError,
} from '../api';

// ─── XHR Mock ─────────────────────────────────────────────────────────────────
// handleTranslate file uploads use XMLHttpRequest (not fetch) so that the
// upload progress event can fire before the server responds.
//
// MockXHR is a real class (not an arrow function) so it can be called with
// `new`. Each construction saves itself to MockXHR.last so tests can access
// the current instance to inspect calls and fire synthetic events.

class MockXHR {
  static last: MockXHR;

  status = 200;
  statusText = 'OK';
  responseText = '{}';

  private _uploadListeners: Record<string, () => void> = {};
  private _listeners: Record<string, () => void> = {};

  upload = {
    addEventListener: (event: string, fn: () => void) => {
      this._uploadListeners[event] = fn;
    },
  };

  constructor() {
    MockXHR.last = this;
  }

  addEventListener(event: string, fn: () => void): void {
    this._listeners[event] = fn;
  }

  open = vi.fn();
  setRequestHeader = vi.fn();
  send = vi.fn();

  /** Fire an upload-level event (e.g. 'load' to signal upload complete). */
  triggerUpload(event: string): void {
    this._uploadListeners[event]?.();
  }

  /** Fire a response-level event (e.g. 'load', 'error', 'abort'). */
  trigger(event: string): void {
    this._listeners[event]?.();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFetchOk(body: unknown, status = 200) {
  return {
    ok: true,
    status,
    statusText: 'OK',
    json: vi.fn().mockResolvedValue(body),
  };
}

function makeFetchError(status: number, body: unknown = null) {
  return {
    ok: false,
    status,
    statusText: 'Error',
    json: vi.fn().mockResolvedValue(body),
  };
}

function makeFile(name = 'scan.jpg', type = 'image/jpeg'): File {
  return new File(['binary'], name, { type });
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal('XMLHttpRequest', MockXHR);
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─── getCredits ───────────────────────────────────────────────────────────────

describe('getCredits', () => {
  it('returns parsed credit data on a successful response', async () => {
    const data = { total_credits: 100, total_usage: 30, remaining: 70 };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeFetchOk(data) as Response);

    const result = await getCredits();

    expect(result).toEqual(data);
  });

  it('calls the correct endpoint', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      makeFetchOk({ total_credits: 0, total_usage: 0, remaining: 0 }) as Response
    );

    await getCredits();

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      'http://localhost:8000/api/ocr/credits/',
      expect.any(Object)
    );
  });

  it('sends X-User-Api-Key header when an API key is provided', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      makeFetchOk({ total_credits: 10, total_usage: 0, remaining: 10 }) as Response
    );

    await getCredits('sk-or-test-key');

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)['X-User-Api-Key']).toBe('sk-or-test-key');
  });

  it('does not send X-User-Api-Key header when no API key is given', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      makeFetchOk({ total_credits: 10, total_usage: 0, remaining: 10 }) as Response
    );

    await getCredits();

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)['X-User-Api-Key']).toBeUndefined();
  });

  it('trims whitespace from the API key before sending', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      makeFetchOk({ total_credits: 10, total_usage: 0, remaining: 10 }) as Response
    );

    await getCredits('  sk-padded  ');

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)['X-User-Api-Key']).toBe('sk-padded');
  });

  it('throws an error containing the status code on a 401 response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeFetchError(401) as Response);

    await expect(getCredits()).rejects.toThrow('HTTP 401');
  });

  it('throws an error containing the status code on a 502 response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeFetchError(502) as Response);

    await expect(getCredits()).rejects.toThrow('HTTP 502');
  });
});

// ─── submitContactMessage ─────────────────────────────────────────────────────

describe('submitContactMessage', () => {
  const validPayload = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    subject: 'Test enquiry',
    message: 'Hello there.',
  };

  const validResponse = {
    id: 'abc-123',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    subject: 'Test enquiry',
    message: 'Hello there.',
    created_at: '2026-01-01T00:00:00Z',
  };

  it('returns the ContactResponse on success', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeFetchOk(validResponse) as Response);

    const result = await submitContactMessage(validPayload);

    expect(result).toEqual(validResponse);
  });

  it('sends a POST request to the contact endpoint', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeFetchOk(validResponse) as Response);

    await submitContactMessage(validPayload);

    const [url, options] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:8000/api/contact/');
    expect(options.method).toBe('POST');
  });

  it('sends Content-Type: application/json', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeFetchOk(validResponse) as Response);

    await submitContactMessage(validPayload);

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('serialises the payload as JSON in the request body', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeFetchOk(validResponse) as Response);

    await submitContactMessage(validPayload);

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(options.body as string)).toEqual(validPayload);
  });

  it('throws ContactApiError with fieldErrors on a 422 validation response', async () => {
    const errorBody = {
      error: 'Validation failed.',
      errors: { email: 'Enter a valid email address.' },
    };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeFetchError(422, errorBody) as Response);

    await expect(submitContactMessage(validPayload)).rejects.toMatchObject({
      name: 'ContactApiError',
      status: 422,
      message: 'Validation failed.',
      fieldErrors: { email: 'Enter a valid email address.' },
    });
  });

  it('throws ContactApiError with a default message when the error body has no message', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeFetchError(500, {}) as Response);

    const error = await submitContactMessage(validPayload).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ContactApiError);
    expect((error as ContactApiError).message).toBe('Failed to submit contact message.');
  });

  it('throws ContactApiError even when the response body is not valid JSON', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    } as unknown as Response);

    const error = await submitContactMessage(validPayload).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ContactApiError);
    expect((error as ContactApiError).status).toBe(503);
  });
});

// ─── handleTranslate — text input ────────────────────────────────────────────

describe('handleTranslate (type: text)', () => {
  it('resolves with the server response on success', async () => {
    const serverResponse = { direct_text: { text: 'Recognised text' } };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeFetchOk(serverResponse) as Response);

    const result = await handleTranslate({ type: 'text', data: 'Fraktur text here' });

    expect(result).toEqual(serverResponse);
  });

  it('sends a POST to the text endpoint', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      makeFetchOk({ direct_text: { text: '' } }) as Response
    );

    await handleTranslate({ type: 'text', data: 'some text' });

    const [url] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:8000/api/ocr/text/');
  });

  it('includes the trimmed text and engine in the request body', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      makeFetchOk({ direct_text: { text: '' } }) as Response
    );

    await handleTranslate({ type: 'text', data: '  hello world  ', engine: 'calamari' });

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(options.body as string)).toEqual({ text: 'hello world', engine: 'calamari' });
  });

  it('defaults the engine to gemini when not specified', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      makeFetchOk({ direct_text: { text: '' } }) as Response
    );

    await handleTranslate({ type: 'text', data: 'text' });

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(options.body as string).engine).toBe('gemini');
  });

  it('sends X-User-Api-Key header when an API key is provided', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      makeFetchOk({ direct_text: { text: '' } }) as Response
    );

    await handleTranslate({ type: 'text', data: 'text', apiKey: 'sk-key' });

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)['X-User-Api-Key']).toBe('sk-key');
  });

  it('calls onUploadDone synchronously before sending the request', async () => {
    const callOrder: string[] = [];
    vi.mocked(globalThis.fetch).mockImplementationOnce(async () => {
      callOrder.push('fetch');
      return makeFetchOk({ direct_text: { text: '' } }) as Response;
    });

    await handleTranslate({
      type: 'text',
      data: 'text',
      onUploadDone: () => callOrder.push('uploadDone'),
    });

    expect(callOrder).toEqual(['uploadDone', 'fetch']);
  });

  it('rejects when an empty string is provided', async () => {
    await expect(handleTranslate({ type: 'text', data: '   ' })).rejects.toThrow(
      'No text provided.'
    );
  });

  it('rejects when data is not a string for type=text', async () => {
    await expect(
      handleTranslate({ type: 'text', data: makeFile() })
    ).rejects.toThrow("Invalid input: type='text' does not match data");
  });

  it('throws on a non-ok server response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      makeFetchError(500, { error: 'Internal server error' }) as Response
    );

    await expect(handleTranslate({ type: 'text', data: 'text' })).rejects.toThrow(
      'Internal server error'
    );
  });

  it('falls back to HTTP status message when error body has no message', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeFetchError(503) as Response);

    await expect(handleTranslate({ type: 'text', data: 'text' })).rejects.toThrow('HTTP 503');
  });
});

// ─── handleTranslate — file upload (XHR) ─────────────────────────────────────

describe('handleTranslate (type: file)', () => {
  it('resolves with the parsed server response when XHR succeeds', async () => {
    const serverResponse = { 'scan.jpg': { text: 'Recognised text' } };

    // Call handleTranslate first so new XMLHttpRequest() runs and MockXHR.last is set.
    const promise = handleTranslate({ type: 'file', data: makeFile() });
    MockXHR.last.responseText = JSON.stringify(serverResponse);
    MockXHR.last.trigger('load');

    await expect(promise).resolves.toEqual(serverResponse);
  });

  it('sends a POST to the upload endpoint', async () => {
    const promise = handleTranslate({ type: 'file', data: makeFile() });
    MockXHR.last.trigger('load');
    await promise;

    expect(MockXHR.last.open).toHaveBeenCalledWith('POST', 'http://localhost:8000/api/ocr/upload/');
  });

  it('appends the engine field to FormData', async () => {
    const promise = handleTranslate({ type: 'file', data: makeFile(), engine: 'calamari' });
    MockXHR.last.trigger('load');
    await promise;

    const formData = MockXHR.last.send.mock.calls[0][0] as FormData;
    expect(formData.get('engine')).toBe('calamari');
  });

  it('appends each file to FormData under the "images" key', async () => {
    const files = [makeFile('a.jpg'), makeFile('b.png', 'image/png')];
    const promise = handleTranslate({ type: 'file', data: files });
    MockXHR.last.trigger('load');
    await promise;

    const formData = MockXHR.last.send.mock.calls[0][0] as FormData;
    const images = formData.getAll('images') as File[];
    expect(images.map((f) => f.name)).toEqual(['a.jpg', 'b.png']);
  });

  it('sets X-User-Api-Key header when an API key is provided', async () => {
    const promise = handleTranslate({ type: 'file', data: makeFile(), apiKey: 'sk-key' });
    MockXHR.last.trigger('load');
    await promise;

    expect(MockXHR.last.setRequestHeader).toHaveBeenCalledWith('X-User-Api-Key', 'sk-key');
  });

  it('does not set X-User-Api-Key header when no API key is given', async () => {
    const promise = handleTranslate({ type: 'file', data: makeFile() });
    MockXHR.last.trigger('load');
    await promise;

    expect(MockXHR.last.setRequestHeader).not.toHaveBeenCalledWith(
      'X-User-Api-Key',
      expect.anything()
    );
  });

  it('calls onUploadDone when the upload finishes (before server response)', async () => {
    const onUploadDone = vi.fn();
    const promise = handleTranslate({ type: 'file', data: makeFile(), onUploadDone });

    expect(onUploadDone).not.toHaveBeenCalled();
    MockXHR.last.triggerUpload('load');
    expect(onUploadDone).toHaveBeenCalledOnce();

    MockXHR.last.trigger('load');
    await promise;
  });

  it('rejects on a network error event', async () => {
    const promise = handleTranslate({ type: 'file', data: makeFile() });
    MockXHR.last.trigger('error');

    await expect(promise).rejects.toThrow('Network error - could not reach server');
  });

  it('rejects when the request is aborted', async () => {
    const promise = handleTranslate({ type: 'file', data: makeFile() });
    MockXHR.last.trigger('abort');

    await expect(promise).rejects.toThrow('Request was cancelled');
  });

  it('rejects when the server responds with a non-200 status', async () => {
    const promise = handleTranslate({ type: 'file', data: makeFile() });
    MockXHR.last.status = 413;
    MockXHR.last.statusText = 'Payload Too Large';
    MockXHR.last.trigger('load');

    await expect(promise).rejects.toThrow('HTTP 413');
  });

  it('rejects when the server returns invalid JSON', async () => {
    const promise = handleTranslate({ type: 'file', data: makeFile() });
    MockXHR.last.responseText = 'not valid json {{';
    MockXHR.last.trigger('load');

    await expect(promise).rejects.toThrow('Invalid response from server');
  });

  it('rejects immediately for an unsupported file extension', () => {
    expect(() =>
      handleTranslate({ type: 'file', data: makeFile('document.txt', 'text/plain') })
    ).toThrow('Unsupported file type');
  });

  it('accepts ZIP files by extension', async () => {
    const zipFile = makeFile('archive.zip', 'application/zip');
    const promise = handleTranslate({ type: 'file', data: zipFile });
    MockXHR.last.trigger('load');

    await expect(promise).resolves.toBeDefined();
  });

  it('accepts TIFF files by extension', async () => {
    const tiffFile = makeFile('scan.tiff', 'image/tiff');
    const promise = handleTranslate({ type: 'file', data: tiffFile });
    MockXHR.last.trigger('load');

    await expect(promise).resolves.toBeDefined();
  });
});

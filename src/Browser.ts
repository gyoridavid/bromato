import { type BrowserContext, chromium } from "patchright";

class Browser {
  private browserContext: BrowserContext;

  constructor(browserContext: BrowserContext) {
    this.browserContext = browserContext;
  }

  getContext(): BrowserContext {
    return this.browserContext;
  }

  static async create(
    userDataDir: string,
    tunnelURL: string,
    serverPort: number,
  ): Promise<Browser> {
    const browserContext = await chromium.launchPersistentContext(userDataDir, {
      channel: "chrome",
      headless: false,
      viewport: null,
    });
    const mainPage = browserContext.pages()[0];
    mainPage.setContent(
      `
      <h1>Hello from Bromato</h1>
      <p>The server runs locally on port ${serverPort}</p>
      <p>The URL: ${tunnelURL} <button id="copy">copy</button></p>
      <ul>
        <li><button id="shutdown">Close the app</button></li>
      </ul>
      <script>

        document.querySelector('button#shutdown').addEventListener('click', () => {
          fetch('http://localhost:${serverPort}/shutdown', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
              console.log('Shutdown response:', data);
            })
            .catch(error => {
              console.error('Error during shutdown request:', error);
            });
        });

        const copyButton = document.querySelector('button#copy');
        copyButton.addEventListener('click', async () => {
          const textToCopy = '${tunnelURL}';

          try {
            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(textToCopy);
              copyButton.textContent = 'Copied!';
            } else {
              // Fallback to execCommand
              const textArea = document.createElement('textarea');
              textArea.value = textToCopy;
              textArea.style.position = 'fixed';
              textArea.style.opacity = '0';
              document.body.appendChild(textArea);
              textArea.select();
              document.execCommand('copy');
              document.body.removeChild(textArea);
              copyButton.textContent = 'Copied!';
            }

            setTimeout(() => {
              copyButton.textContent = 'copy';
            }, 2000);
          } catch (err) {
            console.error('Failed to copy: ', err);
            copyButton.textContent = 'Failed!';
            setTimeout(() => {
              copyButton.textContent = 'copy';
            }, 2000);
          }
        });
      </script>
    `,
    );
    return new Browser(browserContext);
  }

  async close() {
    await this.browserContext.close();
  }
}

export default Browser;

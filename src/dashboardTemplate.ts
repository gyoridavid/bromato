const dashboardTemplate = (
  tunnelURL: string,
  serverPort: number,
  base64Logo: string,
) => `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bromato - Browser Automation Tool</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
          }

          .logo {
            width: 200px;
            height: auto;
            margin: 0 auto 24px;
          }

          h1 {
            color: #2d3748;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 16px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .description {
            color: #718096;
            font-size: 1.1rem;
            margin-bottom: 32px;
            line-height: 1.6;
          }

          .server-info {
            background: #f7fafc;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
            border-left: 4px solid #667eea;
          }

          .server-info h3 {
            color: #2d3748;
            font-size: 1.2rem;
            margin-bottom: 12px;
          }

          .server-info p {
            color: #4a5568;
            margin-bottom: 8px;
          }

          .url-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
            margin-top: 16px;
          }

          .url-text {
            background: white;
            padding: 12px 16px;
            border-radius: 8px;
            border: 2px solid #e2e8f0;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9rem;
            color: #2d3748;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
          }

          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
          }

          .btn:active {
            transform: translateY(0);
          }

          .btn-secondary {
            background: linear-gradient(135deg, #f56565, #e53e3e);
          }

          .btn-secondary:hover {
            box-shadow: 0 8px 20px rgba(245, 101, 101, 0.3);
          }

          .btn-small {
            padding: 8px 16px;
            font-size: 0.9rem;
          }

          .actions {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
          }

          .success {
            background: linear-gradient(135deg, #48bb78, #38a169) !important;
          }

          .error {
            background: linear-gradient(135deg, #f56565, #e53e3e) !important;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="data:image/png;base64,${base64Logo}" alt="Bromato Logo" class="logo" />
          <h1>Bromato</h1>
          <p class="description">
            Yo! Bromato is up and running, use the server URL below to connect your automation tool to the browser and start automating!
          </p>

          <div class="server-info">
            <h3>Server Information</h3>
            <p><strong>Local Port:</strong> ${serverPort}</p>
            <div class="url-container">
              <input type="text" value="${tunnelURL}" class="url-text" readonly />
              <button id="copy" class="btn">Copy URL</button>
            </div>
          </div>

          <div class="actions">
            <button id="shutdown" class="btn btn-secondary">Shutdown Server</button>
          </div>
        </div>
      </body>
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
              copyButton.textContent = 'Copy URL';
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
    `;

export default dashboardTemplate;

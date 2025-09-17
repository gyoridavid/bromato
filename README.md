<h1 align="center">
  <img src="https://github.com/user-attachments/assets/1e53d754-a9e1-4ae1-9d18-9194d5aff144" alt="Bromato screenshot" width="300"/>
  <p>
    Local browser automation
  </p>
</h1>

**Bromato** (bro-MAY-toe) is a local browser automation tool designed for no-code automation platforms like n8n and Make.
It starts a local server and starts a tunnel so even if your n8n instance is running on a VPS it can still connect to your local Bromato instance.
You interact with the browser using HTTP requests to the Bromato server.

Built by [AI Agents A-Z](https://aiagentsaz.com)

[![YouTube Channel Subscribers](https://img.shields.io/youtube/channel/subscribers/UCloXqLhp_KGhHBe1kwaL2Tg)](https://aiagentsaz.com)

## Features

- Start a new session (new tab)
- Close a session
- Navigate to a URL
- Click an element
- Focus an element
- Paste in content from using the OS clipboard
- Evaluate JavaScript
- Take a screenshot
- Reload the page
- Extract text/HTML/markdown content from the page
- Add network request interceptors

## Use-cases

- Scrape websites that are behind a login wall
- Scrape websites that require JavaScript to render content
- Scrape websites with Cloudflare or other bot protection
- Automate repetitive tasks in your browser
- Automate tasks that require a real browser
- Automate form submissions
- ...

The ability to add network interceptors also allows you to get hard-to-reach data from APIs that are not publicly documented.

## Installation

Simply use npx to run Bromato

```bash
npx bromato
```

Available options:

- `-p --port <number>`: Port to run the Bromato server on (default: 3025)
- `-s --subdomain <string>`: Subdomain to use for the tunnel (default: random)
- `-d --userdata <string>`: Path to the browser user data director (default: `~/.bromato/browser-user-data`)

## Acknowledgements

Bromato was built on top of these amazing open-source projects:

- [Playwright](https://playwright.dev/)
- [Fastify](https://www.fastify.io/)
- [localtunnel](https://localtunnel.github.io)
- [Patchright](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright)


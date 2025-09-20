# Bromato API Documentation

Bromato is a powerful browser automation tool that provides a comprehensive REST API for controlling web browsers programmatically. It's built on top of Patchright (Playwright fork) and offers advanced locator capabilities, session management, and network interception.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Base URL and Authentication](#base-url-and-authentication)
3. [Session Management](#session-management)
4. [Navigation and Page Control](#navigation-and-page-control)
5. [Element Interaction](#element-interaction)
6. [Content Extraction](#content-extraction)
7. [Advanced Locator API](#advanced-locator-api)
8. [Network Interception](#network-interception)
9. [System Operations](#system-operations)
10. [Error Handling](#error-handling)

## Getting Started

All API endpoints are prefixed with `/api/v1`. The server provides health checking and graceful shutdown capabilities.

### Health Check

```
GET /healthz
```

**Response:**

```json
{
  "status": "ok"
}
```

### Server Shutdown

```
POST /shutdown
```

**Response:**

```json
{
  "status": "Shutting down"
}
```

## Base URL and Authentication

- **Base URL:** `http://localhost:[PORT]/api/v1`
- **Authentication:** None required
- **Content-Type:** `application/json` (for POST requests)

## Session Management

Sessions represent individual browser instances with their own context, cookies, and state.

### Create Session

```http
POST /api/v1/sessions
```

**Response:**

```json
{
  "id": "unique-session-id"
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/sessions
```

### Delete Session

```http
DELETE /api/v1/sessions/{id}
```

**Parameters:**

- `id` (path): Session ID

**Response:**

```json
{
  "status": "Session {id} was successfully closed"
}
```

**Error Response (404):**

```json
{
  "error": "Session not found"
}
```

## Navigation and Page Control

All navigation endpoints require a valid session ID in the URL path.

### Navigate to URL

```http
POST /api/v1/sessions/{id}/navigate
```

**Request Body:**

```json
{
  "url": "https://example.com",
  "timeout": 30000,
  "waitUntil": "domcontentloaded"
}
```

**Parameters:**

- `url` (string, required): Target URL (must be valid URI)
- `timeout` (number, optional): Navigation timeout in milliseconds
- `waitUntil` (string, optional): When to consider navigation complete
  - `domcontentloaded`: Wait for DOMContentLoaded event
  - `networkidle`: Wait for no network activity for 500ms
  - `load`: Wait for load event
  - `commit`: Wait for navigation commit

**Response:**

```json
{
  "status": 200
}
```

**Error Response (500):**

```json
{
  "error": "Failed to navigate"
}
```

### Go Back

```http
POST /api/v1/sessions/{id}/go_back
```

**Request Body (optional):**

```json
{
  "timeout": 30000,
  "waitUntil": "domcontentloaded"
}
```

**Response:**

```json
{
  "status": 200
}
```

### Go Forward

```http
POST /api/v1/sessions/{id}/go_forward
```

**Request Body (optional):**

```json
{
  "timeout": 30000,
  "waitUntil": "domcontentloaded"
}
```

**Response:**

```json
{
  "status": 200
}
```

### Reload Page

```http
POST /api/v1/sessions/{id}/reload
```

**Request Body (optional):**

```json
{
  "timeout": 30000,
  "waitUntil": "load"
}
```

**Response:**

```json
{
  "status": 200
}
```

## Element Interaction

### Click Element

```http
POST /api/v1/sessions/{id}/click
```

**Request Body:**

```json
{
  "selector": ".button-class"
}
```

**Parameters:**

- `selector` (string, required): CSS selector or XPath

**Response:**

```json
{
  "action": "click",
  "target": ".button-class"
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/sessions/my-session/click \
  -H "Content-Type: application/json" \
  -d '{"selector": "#submit-button"}'
```

### Focus Element

```http
POST /api/v1/sessions/{id}/focus
```

**Request Body:**

```json
{
  "selector": "input[name='username']"
}
```

**Response:**

```json
{
  "action": "focus",
  "target": "input[name='username']"
}
```

### Check Element Visibility

```http
POST /api/v1/sessions/{id}/is_visible
```

**Request Body:**

```json
{
  "selector": "#modal-dialog"
}
```

**Response:**

```json
{
  "is_visible": true
}
```

### Take Screenshot

```http
POST /api/v1/sessions/{id}/screenshot
```

**Request Body:**

```json
{
  "fullPage": true
}
```

**Parameters:**

- `fullPage` (boolean, optional): Capture full page or viewport only (default: true)

**Response:**

- Content-Type: `image/png`
- Binary PNG data

## Content Extraction

### Extract Page Content

```http
GET /api/v1/sessions/{id}/extract_content
```

**Query Parameters:**

- `format` (string, optional): Output format
  - `html`: Raw HTML (default)
  - `text`: Plain text
  - `markdown`: Markdown format
- `selector` (string, optional): CSS selector to extract specific content

**Response:**

```json
{
  "content": "extracted content here"
}
```

**Examples:**

```bash
# Extract entire page as markdown
curl "http://localhost:3000/api/v1/sessions/my-session/extract_content?format=markdown"

# Extract specific element as text
curl "http://localhost:3000/api/v1/sessions/my-session/extract_content?format=text&selector=.main-content"
```

### Execute JavaScript

```http
POST /api/v1/sessions/{id}/evaluate
```

**Request Body:**

```json
{
  "script": "document.title"
}
```

**Response:**

```json
{
  "result": "Page Title"
}
```

**Error Response (500):**

```json
{
  "error": "Failed to evaluate script"
}
```

**Examples:**

```bash
# Get page title
curl -X POST http://localhost:3000/api/v1/sessions/my-session/evaluate \
  -H "Content-Type: application/json" \
  -d '{"script": "document.title"}'

# Get element count
curl -X POST http://localhost:3000/api/v1/sessions/my-session/evaluate \
  -H "Content-Type: application/json" \
  -d '{"script": "document.querySelectorAll(\".item\").length"}'
```

## Advanced Locator API

The Locator API provides sophisticated element targeting using instruction chains. It supports complex combinations of locators, actions, and getters.

### Locator Execute

Execute actions using the locator chain without returning data.

```http
POST /api/v1/sessions/{id}/locator/execute
```

**Request Body:**

```json
{
  "instructions": [
    {
      "type": "getBy",
      "operation": "role",
      "value": "button",
      "options": { "name": "Submit" }
    },
    {
      "type": "action",
      "operation": "click"
    }
  ]
}
```

**Response:**

```json
{
  "status": "done"
}
```

### Locator Get

Execute locator chain and return data from getter operations.

```http
POST /api/v1/sessions/{id}/locator/get
```

**Request Body:**

```json
{
  "instructions": [
    {
      "type": "getBy",
      "operation": "text",
      "value": "Welcome"
    },
    {
      "type": "getter",
      "operation": "textContent"
    }
  ]
}
```

**Response:**

```json
{
  "result": "Welcome to our website"
}
```

### Locator Types

#### 1. GetBy Locators

Target elements using semantic selectors:

**Available operations:**

- `altText`: Find by alt text attribute
- `label`: Find by associated label
- `placeholder`: Find by placeholder text
- `role`: Find by ARIA role
- `testId`: Find by test ID attribute
- `text`: Find by visible text
- `title`: Find by title attribute

**Examples:**

```json
// Find button by role and name
{
  "type": "getBy",
  "operation": "role",
  "value": "button",
  "options": { "name": "Login" }
}

// Find input by placeholder
{
  "type": "getBy",
  "operation": "placeholder",
  "value": "Enter your email"
}

// Find element by test ID
{
  "type": "getBy",
  "operation": "testId",
  "value": "user-profile"
}

// Find by text with regex
{
  "type": "getBy",
  "operation": "text",
  "value": "regex:^Click.*here$"
}
```

**Supported ARIA Roles:**
`alert`, `alertdialog`, `application`, `article`, `banner`, `blockquote`, `button`, `caption`, `cell`, `checkbox`, `code`, `columnheader`, `combobox`, `complementary`, `contentinfo`, `definition`, `deletion`, `dialog`, `directory`, `document`, `emphasis`, `feed`, `figure`, `form`, `generic`, `grid`, `gridcell`, `group`, `heading`, `img`, `insertion`, `link`, `list`, `listbox`, `listitem`, `log`, `main`, `marquee`, `math`, `meter`, `menu`, `menubar`, `menuitem`, `menuitemcheckbox`, `menuitemradio`, `navigation`, `none`, `note`, `option`, `paragraph`, `presentation`, `progressbar`, `radio`, `radiogroup`, `region`, `row`, `rowgroup`, `rowheader`, `scrollbar`, `search`, `searchbox`, `separator`, `slider`, `spinbutton`, `status`, `strong`, `subscript`, `superscript`, `switch`, `tab`, `table`, `tablist`, `tabpanel`, `term`, `textbox`, `time`, `timer`, `toolbar`, `tooltip`, `tree`, `treegrid`, `treeitem`

#### 2. CSS/XPath Locators

```json
{
  "type": "locator",
  "value": ".class-name",
  "options": { "hasText": "specific text" }
}
```

#### 3. Frame Locators

For targeting elements inside iframes:

```json
{
  "type": "framelocator",
  "value": "iframe[name='content']"
}
```

#### 4. Position-based Locators

```json
// Get first element
{
  "type": "first"
}

// Get last element
{
  "type": "last"
}

// Get element by index (0-based)
{
  "type": "nth",
  "value": 2
}
```

#### 5. Logical Locators

**OR operation:**

```json
{
  "type": "or",
  "elements": [
    {
      "type": "getBy",
      "operation": "role",
      "value": "button",
      "options": { "name": "Submit" }
    },
    {
      "type": "getBy",
      "operation": "role",
      "value": "button",
      "options": { "name": "Send" }
    }
  ]
}
```

**AND operation:**

```json
{
  "type": "and",
  "elements": [
    {
      "type": "getBy",
      "operation": "role",
      "value": "button"
    },
    {
      "type": "locator",
      "value": ".primary"
    }
  ]
}
```

#### 6. Filter Locators

```json
{
  "type": "filter",
  "options": {
    "hasText": "Active",
    "has": [
      {
        "type": "locator",
        "value": ".icon"
      }
    ]
  }
}
```

### Locator Actions

**Available actions:**

- `click`: Click element
- `dblclick`: Double-click element
- `fill`: Fill input with text
- `setChecked`: Set checkbox state
- `selectOption`: Select option from dropdown
- `setInputFiles`: Set files for file input elements
- `pressSequentially`: Type text character by character
- `press`: Press keyboard key
- `focus`: Focus element
- `blur`: Remove focus
- `check`: Check checkbox/radio
- `uncheck`: Uncheck checkbox
- `clear`: Clear input content
- `dragTo`: Drag element to target
- `hover`: Hover over element
- `tap`: Tap element (touch)
- `wait`: Wait for specified milliseconds
- `waitFor`: Wait for element state

**Action Examples:**

```json
// Fill input field
{
  "type": "action",
  "operation": "fill",
  "value": "john@example.com"
}

// Select dropdown option
{
  "type": "action",
  "operation": "selectOption",
  "value": "option-value"
}

// Press Enter key
{
  "type": "action",
  "operation": "press",
  "value": "Enter"
}

// Wait for element to be visible
{
  "type": "action",
  "operation": "waitFor",
  "value": "visible"
}

// Upload single file to file input
{
  "type": "action",
  "operation": "setInputFiles",
  "value": {
    "extension": "txt",
    "content": "SGVsbG8gd29ybGQh"
  }
}

// Upload multiple files to file input
{
  "type": "action",
  "operation": "setInputFiles",
  "value": [
    {
      "extension": "txt",
      "content": "SGVsbG8gd29ybGQh"
    },
    {
      "extension": "csv",
      "content": "bmFtZSxhZ2UKSm9obiwzMAo="
    }
  ]
}
```

#### File Upload Details

The `setInputFiles` operation accepts either a single file object or an array of file objects. Each file object has the following structure:

- `extension` (string, required): File extension (e.g., "txt", "csv", "json", "pdf")
- `content` (string, required): Base64-encoded file content

**Examples of Base64 encoding:**

```bash
# Encode a text file
echo "Hello world!" | base64
# Output: SGVsbG8gd29ybGQhCg==

# Encode a file from disk
base64 < /path/to/your/file.txt
```

### Locator Getters

**Available getters:**

- `isVisible`: Check if element is visible
- `count`: Get element count
- `textContent`: Get text content
- `isHidden`: Check if element is hidden
- `isEnabled`: Check if element is enabled
- `isEditable`: Check if element is editable
- `isDisabled`: Check if element is disabled
- `isChecked`: Check if checkbox is checked
- `inputValue`: Get input value
- `innerHTML`: Get inner HTML
- `innerText`: Get inner text
- `getAttribute`: Get attribute value
- `allTextContents`: Get all text contents (for multiple elements)
- `allInnerTexts`: Get all inner texts (for multiple elements)

**Getter Examples:**

```json
// Get element text
{
  "type": "getter",
  "operation": "textContent"
}

// Get attribute value
{
  "type": "getter",
  "operation": "getAttribute",
  "value": "data-id"
}

// Check if element is visible
{
  "type": "getter",
  "operation": "isVisible"
}
```

### Complex Locator Chain Examples

#### Example 1: Login Form Interaction

```json
{
  "instructions": [
    [
      {
        "type": "getBy",
        "operation": "label",
        "value": "Email"
      },
      {
        "type": "action",
        "operation": "fill",
        "value": "user@example.com"
      }
    ],
    [
      {
        "type": "getBy",
        "operation": "label",
        "value": "Password"
      },
      {
        "type": "action",
        "operation": "fill",
        "value": "securepassword"
      }
    ],
    [
      {
        "type": "getBy",
        "operation": "role",
        "value": "button",
        "options": { "name": "Login" }
      },
      {
        "type": "action",
        "operation": "click"
      }
    ]
  ]
}
```

#### Example 2: Data Extraction from Table

```json
{
  "instructions": [
    {
      "type": "getBy",
      "operation": "role",
      "value": "table"
    },
    {
      "type": "locator",
      "value": "tbody tr"
    },
    {
      "type": "filter",
      "options": {
        "hasText": "Active"
      }
    },
    {
      "type": "locator",
      "value": "td:first-child"
    },
    {
      "type": "getter",
      "operation": "allTextContents"
    }
  ]
}
```

#### Example 3: Complex Form with Conditional Elements

```json
{
  "instructions": [
    {
      "type": "getBy",
      "operation": "role",
      "value": "combobox",
      "options": { "name": "Country" }
    },
    {
      "type": "action",
      "operation": "selectOption",
      "value": "United States"
    }
  ]
}
```

#### Example 4: File Upload and Form Submission

```json
{
  "instructions": [
    [
      {
        "type": "locator",
        "value": "input[type=\"file\"]"
      },
      {
        "type": "action",
        "operation": "setInputFiles",
        "value": [
          {
            "extension": "txt",
            "content": "SGVsbG8gd29ybGQh"
          }
        ]
      }
    ],
    [
      {
        "type": "getBy",
        "operation": "label",
        "value": "File description"
      },
      {
        "type": "action",
        "operation": "fill",
        "value": "Sample text document"
      }
    ],
    [
      {
        "type": "getBy",
        "operation": "role",
        "value": "button",
        "options": { "name": "Upload" }
      },
      {
        "type": "action",
        "operation": "click"
      }
    ]
  ]
}
```

## System Operations

### Native Paste

Paste content to the system clipboard and trigger Cmd+V (macOS) paste operation.

```http
POST /api/v1/sessions/{id}/native_paste
```

**Request Body:**

```json
{
  "content": "Text to paste",
  "type": "text"
}
```

**Parameters:**

- `content` (string, required): Content to paste
- `type` (string, optional): Content type
  - `text`: Plain text (default)
  - `html`: HTML content
  - `base64_image`: Base64 encoded image

**Response:**

```json
{
  "status": "Content pasted to system clipboard"
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/sessions/my-session/native_paste \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello World", "type": "text"}'
```

## Network Interception

Network interceptors capture and log HTTP responses matching specified URL patterns.

### Create Interceptor

```http
POST /api/v1/sessions/{id}/interceptors
```

**Request Body:**

```json
{
  "urlPattern": "api/users"
}
```

**Parameters:**

- `urlPattern` (string, required): URL pattern to intercept

**Response:**

```json
{
  "id": "interceptor-id"
}
```

**Error Response (400):**

```json
{
  "error": "Interceptor already exists for the api/users url pattern"
}
```

### Get Interceptor Responses

```http
GET /api/v1/sessions/{id}/interceptors/{interceptorId}/responses
```

**Response:**

```json
{
  "id": "interceptor-id",
  "url": "api/users",
  "responses": [
    {
      "timestamp": "2024-01-01T12:00:00.000Z",
      "url": "https://api.example.com/api/users",
      "status": 200,
      "data": {
        "users": [{ "id": 1, "name": "John Doe" }]
      }
    }
  ]
}
```

### Delete Specific Interceptor

```http
DELETE /api/v1/sessions/{id}/interceptors/{interceptorId}
```

**Response:**

```json
{
  "status": "Interceptor {interceptorId} removed"
}
```

### Delete All Interceptors

```http
DELETE /api/v1/sessions/{id}/interceptors
```

**Response:**

```json
{
  "status": "All interceptors removed"
}
```

## Error Handling

### Common Error Responses

**Session Not Found (404):**

```json
{
  "error": "Session not found"
}
```

**Invalid Request Format (400):**

```json
{
  "error": "Invalid format specified"
}
```

**Server Error (500):**

```json
{
  "error": "Failed to navigate"
}
```

**Locator Chain Error (500):**

```json
{
  "error": "Failed to execute locator chain, error: Invalid locator type: invalidType"
}
```

### Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request format or parameters
- `404 Not Found`: Session or resource not found
- `500 Internal Server Error`: Server-side error occurred

## Best Practices

### Session Management

1. Always create a session before performing operations
2. Delete sessions when done to free resources
3. Handle session not found errors gracefully

### Locator Chains

1. Use semantic locators (`getBy`) when possible for better reliability
2. Combine multiple locator types for precise targeting
3. Use `waitFor` actions for dynamic content
4. Test locator chains with single instructions first

### Network Interception

1. Use specific URL patterns to avoid capturing unwanted requests
2. Clean up interceptors when no longer needed
3. Monitor response data size to prevent memory issues

### Performance

1. Use timeouts appropriately to avoid hanging requests
2. Consider using `domcontentloaded` for faster navigation
3. Batch multiple operations when possible using locator chains

## Examples and Use Cases

### Complete Workflow Example

```bash
#!/bin/bash

# Create session
SESSION_ID=$(curl -s -X POST http://localhost:3000/api/v1/sessions | jq -r '.id')

# Navigate to page
curl -X POST http://localhost:3000/api/v1/sessions/$SESSION_ID/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/login"}'

# Login using locator chain
curl -X POST http://localhost:3000/api/v1/sessions/$SESSION_ID/locator/execute \
  -H "Content-Type: application/json" \
  -d '{
    "instructions": [
      [
        {"type": "getBy", "operation": "label", "value": "Username"},
        {"type": "action", "operation": "fill", "value": "myusername"}
      ],
      [
        {"type": "getBy", "operation": "label", "value": "Password"},
        {"type": "action", "operation": "fill", "value": "mypassword"}
      ],
      [
        {"type": "getBy", "operation": "role", "value": "button", "options": {"name": "Login"}},
        {"type": "action", "operation": "click"}
      ]
    ]
  }'

# Wait for navigation and extract content
sleep 2
curl -s "http://localhost:3000/api/v1/sessions/$SESSION_ID/extract_content?format=markdown" | jq -r '.content'

# Take screenshot
curl -X POST http://localhost:3000/api/v1/sessions/$SESSION_ID/screenshot \
  --output screenshot.png

# Clean up
curl -X DELETE http://localhost:3000/api/v1/sessions/$SESSION_ID
```

This comprehensive documentation covers all aspects of the Bromato API, including detailed examples of the advanced locator system and practical usage patterns.

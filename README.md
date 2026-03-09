# Exposed Files Scanner

Browser-based security scanner to detect exposed sensitive files on domains and IPs. Scans for Git repositories, .env files, config files, SSH keys, cloud credentials, and API endpoints directly in your browser. No server, no uploads, everything runs client-side.

## Features

- 100+ dangerous path detection including Git repos, .env files, configs, SSH keys, cloud credentials
- CSV bulk domain/IP scanning
- Direct file download capability for detected exposures
- GitHub repository URL support
- Browser-based scanning - complete privacy, no data uploaded

## Quick Start

### Prerequisites

1. **Node.js 18+** and **npm**
2. **CORS Proxy Extension** (mandatory for scans to work) — the scanner runs in the browser and target domains block cross-origin requests; the extension’s background script has `host_permissions` so it can fetch any URL without CORS and return the response to the scanner.

**Install the extension first** (from the `cors-proxy-extension/` folder in this repo):

- **Firefox**: `about:debugging` → This Firefox → Load Temporary Add-on → select `cors-proxy-extension/manifest.json` (or run `make firefox` in that folder and load the generated `.xpi`)
- **Chrome**: `chrome://extensions` → Developer mode ON → Load unpacked → select the `cors-proxy-extension/` folder (no build needed; or run `make chrome` there to get a `.zip` for distribution)

No build step is required for local install — the browser loads the extension from the folder. Use the Makefile only if you want a packaged `.xpi` (Firefox) or `.zip` (Chrome) to share or install from file.

**Security**: Only these origins can use the proxy: `peachycloudsecurity.com`, `localhost`, `127.0.0.1`. The background script checks `sender.origin` and only allows http/https URLs, so other sites cannot abuse the extension.

### Installation

```bash
git clone https://github.com/peachycloudsecurity/exposed-files-scanner.git
cd exposed-files-scanner
npm install
```

### Development

```bash
npm run dev
```

> Opens at `http://localhost:8080`. Ensure the CORS Proxy Extension is installed and reload the page; in the console `typeof window.__corsProxyFetch` should be `"function"`.


## Usage

1. **Upload CSV** - Bulk scan domains/IPs from a CSV file
2. **Paste Domains** - Manually enter domains or IPs (one per line or comma-separated)
3. **Configure Settings** - Adjust timeout, concurrent requests, and enable/disable specific scan categories
4. **Review Results** - View detected exposures with severity ratings
5. **Download Files** - Direct download of detected Git repos and exposed files
6. **Export Reports** - Export results as CSV or JSON

## Scan Categories

- **Git Repository** - `.git/` folders exposing source code
- **SVN Repository** - `.svn/` folders with version control data
- **Mercurial Repository** - `.hg/` folders
- **Environment Files** - `.env`, `.env.local`, `.env.production`, etc.
- **DS_Store** - macOS `.DS_Store` files
- **Config Files** - `wp-config.php`, `config.json`, `web.config`, etc.
- **Debug/Admin** - Spring Boot Actuator, Swagger, GraphQL endpoints
- **Backup Files** - SSH keys, database dumps, `.git-credentials`
- **Log Files** - Application logs
- **Package Files** - `package.json`, `composer.json`, etc.
- **API Endpoints** - Admin APIs, encryption keys endpoints

## CORS and the extension

Without the CORS Proxy Extension, the browser blocks cross-origin requests and most scans/downloads fail. Install the extension (see Prerequisites); the scanner automatically uses `window.__corsProxyFetch` when present.

## Project Structure

```
src/
├── components/     # React UI components
├── lib/            # Scanner engine and path definitions
├── hooks/          # React hooks for scanner logic
└── utils/          # File handling utilities
cors-proxy-extension/
├── manifest.json   # Extension manifest (Chrome + Firefox)
├── background.js   # Fetches URLs without CORS
├── content.js      # Bridge between page and background
└── README.md       # Extension install and usage
```

## Scripts

- `npm run dev` - Development server at localhost:8080
- `npm run lint` - Run ESLint

## Technical Details

- Client-side only, no server required
- Security path detection based on common exposures
- CSV parsing with papaparse
- File operations with jszip, file-saver, pako
- Direct Git repository reconstruction from exposed .git folders

## Troubleshooting

**No exposures detected**: Domains may be properly secured, or CORS prevents access. Install and reload the CORS Proxy Extension, then hard refresh the scanner page.

**Download failures**: Install the CORS Proxy Extension (Prerequisites). Without it, cross-origin requests are blocked by the browser.

**Large scans**: Scanning 1000+ domains may take several minutes. Progress is shown during scanning.

## License

GPL-3.0. See LICENSE file for details.

## Disclaimer

This tool is designed for security auditing and analysis of domains and systems you own or have explicit permission to scan. Always ensure you have proper authorization before scanning domains or systems you don't own. The authors are not responsible for any misuse of this software.

This website, apps, scanner and results are provided strictly for educational and authorized security testing purposes, independently authored and not endorsed by the author's employers or any corporate entity, provided without warranties or guarantees, with no liability accepted for misuse or misapplication.

## Peachycloud Security

Hands-On Multi-Cloud & Cloud-Native Security Education

Created by The Shukla Duo (Anjali & Divyanshu), this tool is part of our mission to make cloud security accessible through practical, hands-on learning. We specialize in AWS, GCP, Kubernetes security, and DevSecOps practices.

### Learn & Grow

Explore our educational content and training programs:

[YouTube Channel](https://www.youtube.com/@peachycloudsecurity) | [Website](https://peachycloudsecurity.com) | [1:1 Consultations](https://topmate.io/peachycloudsecurity)

Learn cloud security through hands-on labs, real-world scenarios, and practical tutorials covering GCP & AWS, GKE & EKS, Kubernetes, Containers, DevSecOps, and Threat Modeling.

### Support Our Work

If this tool helps you secure your infrastructure, consider supporting our educational mission:

[Sponsor on GitHub](https://github.com/sponsors/peachycloudsecurity)

Your support helps us create more free educational content and security tools for the community.

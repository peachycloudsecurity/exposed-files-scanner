# Exposed Files Scanner

Browser-based security scanner to detect exposed sensitive files on domains and IPs. Scans for Git repositories, .env files, config files, SSH keys, cloud credentials, and API endpoints directly in your browser. No server, no uploads, everything runs client-side.

## Features

- 100+ dangerous path detection including Git repos, .env files, configs, SSH keys, cloud credentials
- CSV bulk domain/IP scanning
- Direct file download capability for detected exposures
- GitHub repository URL support
- Browser-based scanning - complete privacy, no data uploaded
- Single file HTML output for easy deployment

## Quick Start

### Prerequisites

Node.js 18+ and npm

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

Opens at `http://localhost:8080`

### Build

```bash
npm run build
```

Builds a single `index.html` file in the `docs/` folder. Open `docs/index.html` in your browser to use the scanner.

The build bundles all CSS and JavaScript inline into one HTML file using vite-plugin-singlefile.

### Deployment

Upload `docs/index.html` to any static hosting service. Works with GitHub Pages, Netlify, Vercel, or any web server.

For GitHub Pages, enable Pages in repository settings and point to the `docs` folder. The included GitHub Actions workflow automatically builds on push to main branch.

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

## CORS Handling

Due to browser CORS restrictions, some downloads may fail for certain domains. The scanner will notify you of CORS-related issues.

## Project Structure

```
src/
├── components/     # React UI components
├── lib/            # Scanner engine and path definitions
├── hooks/          # React hooks for scanner logic
└── utils/          # File handling utilities
```

## Build Scripts

- `npm run dev` - Development server at localhost:8080
- `npm run build` - Production build to `docs/` folder
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Technical Details

- Client-side only, no server required
- Single file HTML output for production
- Security path detection based on common exposures
- CSV parsing with papaparse
- File operations with jszip, file-saver, pako
- Direct Git repository reconstruction from exposed .git folders

## Troubleshooting

**No exposures detected**: Domains may be properly secured, or CORS prevents access.

**Download failures**: CORS restrictions on target domain. Try using a CORS proxy or accessing from server-side.

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

# CORS Proxy Extension

Minimal browser extension that proxies fetch requests blocked by CORS. Designed for the [Exposed Files Scanner](https://github.com/peachycloudsecurity/exposed-files-scanner) but works as a standalone extension for any page on allowed origins.

## Why

Browsers block cross-origin requests that don't include CORS headers. The Exposed Files Scanner runs in the browser and needs to check paths like `https://target.com/.git/HEAD` from `https://peachycloudsecurity.com`. Without this extension, those requests fail silently.

The extension's background service worker has `host_permissions` for all URLs, so it can fetch any URL without CORS restrictions. It acts as a bridge: the page asks the extension to fetch a URL, the extension does it, and returns the result.

## Install

**Firefox**

```
1. Open about:debugging in Firefox
2. Click "This Firefox" on the left
3. Click "Load Temporary Add-on"
4. Navigate to this folder and select manifest.json
```

**Chrome**

```
1. Open chrome://extensions
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select this folder
```

## Verify

Open the scanner page and run in the browser console:

```
typeof window.__corsProxyFetch
```

Should return `"function"`.

## Use with the Scanner

1. Install this extension (steps above)
2. Open the Exposed Files Scanner at `https://peachycloudsecurity.com/apps/exposed-files-scanner` or `http://localhost:8080`
3. Run a scan - all requests will automatically go through the extension

The scanner detects the extension and uses it when available. No configuration needed.

## Allowed Origins

The extension only injects on these pages:

- `https://peachycloudsecurity.com/*`
- `http://localhost/*` and `http://localhost:8080/*`
- `http://127.0.0.1/*` and `http://127.0.0.1:8080/*`

Other pages cannot use the proxy.

## Build for Distribution

```
make chrome    # creates cors-proxy-extension-chrome.zip
make firefox   # creates cors-proxy-extension.xpi
make clean     # removes build artifacts
```

## Security

- Only pages on allowed origins can use the proxy (enforced by content script match patterns and background origin validation)
- Only `http` and `https` protocols are allowed
- No cookies or credentials are sent with proxied requests
- No data is stored or logged

## License

GPL-3.0



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

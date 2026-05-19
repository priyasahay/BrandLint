# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | ✅ |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Email the maintainer (contact details on [GitHub profile]) and include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact

The maintainer will review and respond. If confirmed, a fix will be released and you will be credited (unless you prefer to remain anonymous).

## Scope

BrandLint runs **entirely locally** — no data is sent to external servers. The attack surface is:

- The local Express HTTP server (port 3000, localhost only by default)
- The SQLite database in `./data/`
- Outbound HTTP requests made by the scraper to user-supplied URLs

## Known Limitations

- The scraper fetches arbitrary URLs provided by the user. Do not expose the `/api/analyze` endpoint to the public internet without adding authentication.
- The SQLite database is stored unencrypted on disk. Do not store sensitive URLs if the machine is shared.

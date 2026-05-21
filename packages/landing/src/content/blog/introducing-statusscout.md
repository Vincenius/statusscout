---
title: "Introducing StatusScout"
date: "2026-05-11"
image: "/blog/introducing-statusscout.png"
description: "StatusScout is a self-hosted website monitoring and security scanning platform. Here's why I built it and what it can do."
---

Something started bothering me as AI coding tools got really good. With Lovable, Bolt, or v0 you can ship a working web app in an afternoon with no technical background. That's actually pretty cool.

But those apps ship with real user data, real forms, real APIs, and the person who built it often has no idea what an insecure cookie flag is, or that their Swagger docs are publicly accessible, or that they're loading scripts from CDNs without integrity checks. The site works, so it feels fine.

I wanted something that could look at any site and catch the things a non-technical builder wouldn't think to check. So I built StatusScout.

## What is StatusScout?

StatusScout is a self-hosted monitoring platform that scans your websites for security issues and keeps an eye on uptime. You run it on your own server, so your data stays there.

## What does it check?

Every site you add gets scanned for a bunch of things:

- **Uptime:** HTTP status and response time, every 5 minutes
- **SSL:** certificate validity and expiry warnings
- **Security headers:** CSP, HSTS, X-Content-Type-Options, and more
- **Cookies:** checks for missing HttpOnly, Secure, and SameSite flags
- **DNS:** SPF, DMARC, DKIM, CAA, subdomain takeover detection
- **Fuzz scanning:** probes for exposed paths and hidden files
- **Mixed content:** detects HTTP resources loaded on HTTPS pages
- **Page analysis:** SRI on external scripts, CSRF token presence, exposed stack traces, directory listings
- **API exposure:** detects publicly accessible Swagger, OpenAPI, and GraphQL endpoints

The security checks are especially useful for AI-built apps. Things like exposed API docs or missing cookie flags are exactly what slips through when you've never had to think about it before.

## Try it without self-hosting

If you just want to run a quick scan on a site, there's a [free check](/) on the homepage. No account needed.

## It's open source

The full code is on GitHub at [github.com/vincenius/statusscout](https://github.com/vincenius/statusscout). Feel free to inspect it, open issues, or fork it for your own setup.

Are there security checks you'd want to see that aren't on the list? I'm still adding things to it 😊

Cheers, Vincent

import runSubzy from '../utils/runSubzy.js';
import getSubdomains from '../utils/runSubfinder.js';
import { createCheckResult } from '../db.js';
import dns from 'dns/promises';

const dkimSelectors = [
  // Generic / common
  "default", "selector",
  "mail", "email", "smtp", "mx",
  // Google Workspace
  "google",
  // Microsoft 365 / Exchange
  "selector",
  // Amazon SES
  "amazonses", "dkim", "ses",
  // SendGrid
  "sendgrid", "sg", "sendgrid.net",
  // Mailchimp / Mandrill
  "k", "mailchimp", "mandrill",
  // Zoho
  "zoho",
  // Fastmail
  "fm",
  // Proton
  "protonmail", "pm",
  // Other transactional email services
  "mailgun", "mg", "sparkpost", "postmark", "hubspot", "sendinblue", "brevo", "campaignmonitor"
].map(s => [s, `${s}1`, `${s}2`, `${s}3`, `${s}4`]).flat();

const checkSubdomains = async (subs) => {
  const promises = subs.map(async (sub) => {
    try {
      const subIssues = await runSubzy(sub);
      if (Array.isArray(subIssues) && subIssues.length > 0) {
        // Map each returned issue text to an object with subdomain and text
        return subIssues.map(text => ({ subdomain: sub, text }));
      }
      return [];
    } catch (err) {
      console.error(`Error running subzy for ${sub}:`, err);
      return [];
    }
  });

  const nested = await Promise.all(promises);
  // flatten array of arrays into a single array of issue objects
  return nested.flat();
}


async function checkRecord(type, name) {
  try {
    return await dns.resolve(name, type);
  } catch {
    return [];
  }
}

async function checkTxtRecords(name) {
  try {
    const records = await dns.resolveTxt(name);
    return records.flat().join(" ");
  } catch {
    return "";
  }
}

export const runDnsCheck = async ({ uri, id, websiteId, createdAt, quickcheckId, type, db }) => {
  // get domain from domain
  const domain = new URL(uri).hostname;
  console.log(`Running dns check for ${uri}`)

  const results = {}
  const rand = Math.random().toString(36).substring(2, 10);

  // NS records
  const [ns, mx, aaaa, spfRecords, dmarcRecords, caa, ds, dnskey, wildcard, subfinderSubdomains] = await Promise.all([
    checkRecord("NS", domain),
    dns.resolveMx(domain).catch(() => []),
    checkRecord("AAAA", domain),
    checkTxtRecords(domain),
    checkTxtRecords(`_dmarc.${domain}`),
    checkRecord("CAA", domain),
    checkRecord("DS", domain),
    checkRecord("DNSKEY", domain),
    checkRecord("A", `${rand}.${domain}`),
    getSubdomains(domain)
  ])

  // store subdomains in website db because subfinder might fail ocassionally
  const website = websiteId
    ? await db.collection('websites').findOne({ _id: websiteId })
    : null;
  const storedSubdomains = website?.subdomains || [];
  const subdomains = [...new Set([...storedSubdomains, ...subfinderSubdomains])];

  // check if every subdomain is already stored
  if (website && subdomains.every(sub => storedSubdomains.includes(sub)) === false) {
    await db.collection('websites').updateOne(
      { _id: websiteId },
      { $set: { subdomains } }
    );
  }

  const spf = spfRecords.match(/v=spf1[^"]*/i);
  const dmarc = dmarcRecords.match(/v=DMARC1[^"]*/i);

  results.ns = { records: ns, success: ns.length > 0 };
  results.mx = { records: mx, success: mx.length > 0 };
  results.aaaa = { records: aaaa, success: aaaa.length > 0 };
  results.spf = { records: spf ? spf[0] : null, success: !!spf };
  results.dmarc = { records: dmarc ? dmarc[0] : null, success: !!dmarc };

  // DKIM (common selector check)
  let dkimSelector;
  for (const s of dkimSelectors) {
    const record = `${s}._domainkey.${domain}`;
    const dkim = await checkTxtRecords(record);
    if (dkim) {
      dkimSelector = record;
      break;
    }
  }

  results.dkim = { records: dkimSelector, success: !!dkimSelector };
  results.caa = { records: caa, success: caa.length > 0 };
  results.ds = { records: ds, success: ds.length > 0 };
  results.dnskey = { records: dnskey, success: dnskey.length > 0 };
  results.wildcard = { records: wildcard, success: wildcard.length === 0 };

  const subdomainIssues = await checkSubdomains(subdomains);
  results.subdomains = {
    issues: subdomainIssues,
    success: subdomainIssues.length === 0
  };

  const result = {
    status: (!results.wildcard.success || !results.subdomains.success) ? 'fail' : 'success',
    details: results,
  }
  await createCheckResult({ id, websiteId, createdAt, check: 'dns', result, quickcheckId, type })
};

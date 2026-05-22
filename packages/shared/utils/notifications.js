export const checkDefaultNotifications = {
  'uptime': 'critical',
  'ssl': 'critical',
  'headers': 'daily',
  'cookies': 'daily',
  'fuzz': 'critical',
  'dns': 'daily',
  'mixedcontent': 'daily',
  'pageanalysis': 'daily',
  'apidocs': 'daily',
}

export const checkNameMap = {
  'uptime': 'Uptime',
  'ssl': 'SSL Certificate',
  'headers': 'Missing Security Header',
  'cookies': 'Insecure Cookie',
  'fuzz': 'Exposed Sensitive File',
  'dns': 'DNS Record',
  'mixedcontent': 'Mixed Content',
  'pageanalysis': 'Page Analysis',
  'apidocs': 'Exposed API Docs',
  'custom': 'Custom Flow',
}

export const getNotificationMessage = ({ type, details }) => {
  const messageMap = {
    'uptime': 'Uptime check failed',
    'ssl': 'SSL certificate issue detected',
    'headers': `Missing security header: ${details}`,
    'cookies': `Insecure cookie detected: ${details}`,
    'fuzz': `Sensitive file exposed: ${details}`,
    'dns': `DNS issue detected: ${details}`,
    'mixedcontent': `Mixed content detected: ${details}`,
    'pageanalysis': `Page analysis issue: ${details}`,
    'apidocs': `API documentation exposed: ${details}`,
    'custom': `Custom flow failed: ${details}`,
  }

  return messageMap[type]
}
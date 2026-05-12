const recommendedHeaders = {
  'content-security-policy': 'Helps prevent cross-site scripting (XSS), clickjacking, and other code injection attacks by controlling the sources of content the browser is allowed to load.',
  'strict-transport-security': 'Enforces secure (HTTPS) connections to the server to protect against protocol downgrade attacks and cookie hijacking.',
  'x-content-type-options': 'Prevents browsers from MIME-sniffing a response away from the declared content-type, reducing exposure to drive-by download attacks.',
  'x-frame-options': 'Protects against clickjacking by preventing your site from being embedded in an iframe from another origin.',
  'referrer-policy': 'Controls how much referrer information is included with requests. Helps prevent leaking sensitive URLs.',
  'permissions-policy': 'Restricts the use of powerful browser features (like geolocation, camera, microphone) to improve privacy and security.',
  'cross-origin-resource-policy': 'Prevents other origins from loading your resources unless explicitly allowed, reducing the risk of data leaks.',
  'cross-origin-opener-policy': 'Ensures a top-level document does not share a browsing context group with cross-origin documents, mitigating side-channel attacks like Spectre.',
  'cross-origin-embedder-policy': 'Requires subresources to be CORS-enabled, which is necessary for advanced features like SharedArrayBuffer and better isolation.'
};

export default recommendedHeaders

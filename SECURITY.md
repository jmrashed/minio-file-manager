# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in MinIO File Manager, please report it responsibly.

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please send an email to: [your.email@example.com](mailto:your.email@example.com)

Include the following information in your report:

- **Type of vulnerability** (e.g., XSS, CSRF, credential exposure)
- **Affected versions**
- **Steps to reproduce** the vulnerability
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up questions

We will acknowledge receipt of your report within 48 hours and will send a more detailed response within 72 hours indicating the next steps in handling your report.

After the initial reply to your report, we will endeavor to keep you informed of the progress towards a fix and full announcement. We may ask for additional information or guidance.

## Security Best Practices

### For Users

1. **Use HTTPS/SSL in Production**
   - Always enable SSL (`useSSL: true`) when deploying to production
   - Use valid TLS certificates for your MinIO endpoint
   - Never transmit credentials over unencrypted connections

2. **Protect Your MinIO Credentials**
   - This application stores credentials in browser localStorage
   - Clear browser data when using shared or public computers
   - Use dedicated MinIO service accounts with limited permissions
   - Rotate access keys regularly

3. **Configure MinIO CORS Properly**
   - Restrict CORS origins to your application's domain only
   - Do not use wildcard (`*`) origins in production
   - Example MinIO CORS configuration:
     ```json
     {
       \"cors\": [
         {
           \"origin\": [\"https://yourdomain.com\"],
           \"method\": [\"GET\", \"PUT\", \"POST\", \"DELETE\"],
           \"allowedHeaders\": [\"*\"]
         }
       ]
     }
     ```

4. **Keep Dependencies Updated**
   - Regularly run `npm audit` to check for vulnerabilities
   - Update dependencies promptly when security patches are released

5. **Use Environment Variables for Configuration**
   - Never commit `.env.local` or credential files to version control
   - Use different credentials for development and production

### For Developers

1. **Input Validation**
   - Always validate bucket names using the `validateBucketName()` utility
   - Validate file names using `validateFileName()` before operations
   - Sanitize user inputs to prevent injection attacks

2. **Pre-signed URLs**
   - Always use pre-signed URLs for file access operations
   - Set appropriate expiration times (default: 1 hour)
   - Never expose raw S3 credentials in client-side code or URLs

3. **Error Handling**
   - Do not expose stack traces or internal paths in production
   - Log security-relevant errors server-side when possible
   - Use generic error messages for authentication failures

4. **Content Security**
   - Validate file types before upload and preview operations
   - Use Content-Type headers correctly when uploading files
   - Be cautious with executable file types

## Known Security Considerations

### Credential Storage

This application stores MinIO credentials in the browser's **localStorage** for simplicity. This approach has the following security implications:

- Credentials persist until explicitly cleared or the browser cache is cleared
- Other scripts running on the same origin can access these credentials
- No automatic expiration of stored credentials

**Mitigation:** Users should log out when finished, and administrators should use short-lived credentials where possible.

### CORS Requirements

MinIO must be configured with appropriate CORS settings to allow browser-based access. Misconfigured CORS can:

- Allow unauthorized origins to access your MinIO instance
- Expose credentials to unintended domains

**Mitigation:** Always restrict CORS origins in production environments.

### Client-Side Only

This is a client-side only application. All S3 API calls are made directly from the browser to MinIO. This means:

- Network traffic can be inspected by users
- Rate limiting and abuse prevention must be handled at the MinIO level
- There is no server-side audit logging of file operations

## Acknowledgments

We thank the following individuals and organizations for their responsible disclosure of security issues:

*(This list will be updated as vulnerabilities are reported and fixed.)*

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MinIO Security Documentation](https://min.io/docs/minio/linux/operations/network-encryption.html)
- [AWS S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)

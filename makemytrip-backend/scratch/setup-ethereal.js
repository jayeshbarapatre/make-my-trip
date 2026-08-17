import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

(async () => {
  console.log('Generating Ethereal email credentials...');
  const testAccount = await nodemailer.createTestAccount();
  console.log('Credentials generated:', testAccount.user);

  const envPath = path.resolve('h:/make-my-trip-practical/makemytrip-backend/.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Replace SMTP_HOST
  envContent = envContent.replace(/SMTP_HOST=.*/, `SMTP_HOST=${testAccount.smtp.host}`);
  // Replace SMTP_PORT
  envContent = envContent.replace(/SMTP_PORT=.*/, `SMTP_PORT=${testAccount.smtp.port}`);
  // Replace SMTP_USER
  envContent = envContent.replace(/SMTP_USER=.*/, `SMTP_USER=${testAccount.user}`);
  // Replace SMTP_PASS
  envContent = envContent.replace(/SMTP_PASS=.*/, `SMTP_PASS=${testAccount.pass}`);

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('Updated .env file with Ethereal SMTP credentials.');
  console.log('Preview URL for emails sent with Ethereal will be logged by nodemailer, or you can log in at https://ethereal.email with the user and pass.');
})();

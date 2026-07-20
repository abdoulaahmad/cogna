import { EmailService } from '@/services/email.service';

async function test() {
  console.log('Starting email test...');
  try {
    await EmailService.sendVerificationEmail('1asufak@gmail.com', '987654');
    console.log('✅ Success! Test email sent to 1asufak@gmail.com.');
  } catch (error) {
    console.error('❌ Error sending test email:', error);
  }
}

test();

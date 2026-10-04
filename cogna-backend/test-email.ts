import { EmailService } from '@/services/email.service';

async function test() {
  console.log('Starting email test...');
  try {
    await EmailService.sendVerificationEmail('abdullahiabbaahmad39@gmail.com', '123456');
    console.log('✅ Success! Test email sent to abdullahiabbaahmad39@gmail.com.');
  } catch (error) {
    console.error('❌ Error sending test email:', error);
  }
}

test();

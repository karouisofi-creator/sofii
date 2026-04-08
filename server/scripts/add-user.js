import { create } from './server/store/sqlStore.js';

async function addUser() {
  const user = {
    email: 'admin@example.com',
    fullName: 'Admin User',
    password: 'YourPassword123', // Change this to your desired password
    role: 'admin',
  };
  try {
    const result = await create(user);
    console.log('User created:', result);
  } catch (err) {
    console.error('Error creating user:', err);
  }
}

addUser();

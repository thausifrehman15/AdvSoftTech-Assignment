import axios from 'axios';

export const login = async (credentials) => {
  // Dummy API call for login
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (credentials.email === 'test@example.com' && credentials.password === 'password') {
        resolve({ message: 'Login successful' });
      } else {
        reject({ message: 'Invalid email or password' });
      }
    }, 1000);
  });
};

export const register = async (userData) => {
  // Dummy API call for registration
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (userData.email === 'test@example.com') {
        reject({ message: 'Email already exists' });
      } else {
        resolve({ message: 'Registration successful' });
      }
    }, 1000);
  });
};

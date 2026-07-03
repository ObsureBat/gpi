import { Router } from 'express';

export const configRouter = Router();

configRouter.get('/store-config', (req, res) => {
  res.json({
    brandName: 'GPI Industries Pvt. Ltd.',
    brandDescription:
      'GPI Industries Pvt. Ltd. delivers high-quality Himalayan salts, authentic Indian spices, and household essentials crafted with purity, tradition, and trust.',
    announcement: {
      mainText: 'WELCOME TO THE STORE',
      subText: 'GPI INDUSTRIES PVT. LTD.',
    },
    contact: {
      phone: '+91 7078750755',
      email: 'info@gpiindustries.com',
      location: 'India',
    },
    social: {
      facebook: 'https://facebook.com/gpiindustries',
      instagram: 'https://instagram.com/gpiindustries',
      youtube: 'https://youtube.com/@gpiindustries',
    },
    currency: 'INR',
    currencySymbol: '₹',
  });
});

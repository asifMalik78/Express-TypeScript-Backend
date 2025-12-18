import arcjet, { detectBot, shield, slidingWindow } from '@arcjet/node';

const aj = arcjet({
  key: process.env.ARCJET_KEY ?? '',
  rules: [
    shield({ mode: 'LIVE' }),
    detectBot({
      allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'],
      mode: 'LIVE',
    }),
    slidingWindow({
      interval: '2s',
      max: 5,
      mode: 'LIVE',
    }),
  ],
});

export default aj;

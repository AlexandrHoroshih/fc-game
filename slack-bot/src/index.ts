import {App} from "@slack/bolt";

let app: App = require('./server').default;

if (module.hot) {
  module.hot.accept('./server', () => {
    console.log('🔁  HMR Reloading `./server`...');
    try {
      app = require('./server').default;
    } catch (error) {
      console.error(error);
    }
  });
  console.info('✅  Server-side HMR Enabled!');
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export default app.start().then(() => console.log(`> App started http://localhost:${process.env.PORT}`))
const Hapi = require('@hapi/hapi');
const { predictionHandler } = require('./handlers/predictionHandler');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 8080,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  server.route({
    method: 'POST',
    path: '/predict',
    options: {
      payload: {
        maxBytes: 1000000, // 1MB limit
        multipart: true,
        output: 'stream',
      },
    },
    handler: predictionHandler,
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
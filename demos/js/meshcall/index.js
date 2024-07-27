//USAGE            `npm run demo:js:meshcall cat dog mouse`        ///////

console.log('\n* initializing meshcall demo ...\n');

const { MeshCall } = require('@hotmeshio/hotmesh');
const { getRedisConfig } = require('../config');

(async () => {
  try {
    //1) Connect a worker function
    console.log('\n* connecting worker ...\n');
    await MeshCall.connect({
      namespace: 'meshcall',
      topic: 'my.function',
      redis: getRedisConfig(),
      callback: async function(userID) {
        //do stuff...
        console.log('callback was called >', userID);
        return `Welcome, ${userID}.`;
      },
    });

    //2) Call the worker function 
    console.log('\n* calling worker through the mesh ...\n');
    const response = await MeshCall.exec({
      namespace: 'meshcall',
      topic: 'my.function',
      args: ['CoolMesh'],
      redis: getRedisConfig(),
    });
    console.log('\n* worker response >', response);

    //3) Clear the cached response (in case any exist)
    console.log('\n* clearing the cache ...\n');
    await MeshCall.flush({
      namespace: 'meshcall',
      topic: 'my.function',
      id: 'mycached123',
      redis: getRedisConfig(),
      options: { id: 'mycached123' }, //this format also works
    });

    //4) Loop 4 times
    //     the callback function will have been called 1 time
    //     even though the response is returned 4 times
    for (let i = 0; i < 4; i++) {
      //only the first iteration is called
      const cached = await MeshCall.exec({
        namespace: 'meshcall',
        topic: 'my.function',
        args: ['CachedMesh'],
        redis: getRedisConfig(),
        options: { id: 'mycached123', ttl: '1 day' },
      });
      console.log('* cached response for 1 day>', cached);
    }

    //4) Shutdown MeshCall
    await MeshCall.shutdown();

    console.log('\n* shutting down...\n');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
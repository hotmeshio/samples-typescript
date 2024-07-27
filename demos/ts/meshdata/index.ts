//USAGE            `npm run demo:ts:meshdata cat dog mouse`        ///////

console.log('\n* initializing meshdata demo ...\n');

import 'dotenv/config';
import { Types, MeshData } from '@hotmeshio/hotmesh';
import { getRedisConfig } from '../config';
import { setupTelemetry } from '../../../telemetry/index';

const redisConfig = getRedisConfig();
setupTelemetry();

(async () => {
  try {
    let userIDs = process.argv.slice(2);
    if (!userIDs.length) {
      userIDs = ['cat', 'dog', 'mouse'];
    }

    //1) Define a search schema
    const schema = {
      schema: {
        id: { type: 'TAG', sortable: true },
        plan: { type: 'TAG', sortable: true },
        active: { type: 'TEXT', sortable: false },
      },
      index: 'default',    //the index name in Redis is 'default'
      prefix: ['default'], //only index documents with keys that begin with 'default'
    } as unknown as Types.WorkflowSearchOptions;

    //2) Initialize MeshData and Redis
    const meshData = new MeshData(
      redisConfig.class,
      redisConfig.options,
      schema,
    );

    //3) Connect a 'default' worker function
    console.log('\n* connecting workers ...\n');
    await meshData.connect({
      entity: 'default',
      target: async function(userID: string): Promise<string> {

        const search = await MeshData.workflow.search();
        await search.set('active', 'yes');

        //simulate a database call
        return `Welcome, ${userID}.`;
      },
      options: { namespace: 'meshdata' },
    });

    // Loop; call the 'default' worker for each user
    console.log('\n\n* inserting messages ...\n');
    for (const userID of userIDs) {

      //4) Call the 'default' worker function; include search data
      const response = await meshData.exec({
        entity: 'default',
        args: [userID],
        options: {
          ttl: 'infinity', //the function call is now a persistent, 'live' record
          id: userID,
          search: {
            data: { id: userID, plan: 'pro' }
          },
          namespace: 'meshdata', //redis app name (default is 'meshflow')
        },
      });

      //5) Read data (by field name) directly from Redis
      const data = await meshData.get(
        'default',
        userID,
        { 
          fields: ['plan', 'id', 'active'],
          namespace: 'meshdata'
        },
      );

      console.log(`${userID === userIDs[0] ? '\n' : ''}* UserID: ${userID}, function response =>`, response, 'function state =>', data);
    }

    //6) Create a search index
    console.log('\n\n* creating search index ...');
    await meshData.createSearchIndex('default', { namespace: 'meshdata' }, schema);

    //7) Full Text Search for records
    const results = await meshData.findWhere('default', {
      query: [{ field: 'id', is: '=', value: userIDs[userIDs.length - 1] }],
      limit: { start: 0, size: 100 },
      return: ['plan', 'id', 'active']
    });
    console.log(`\n\n* matching message (${userIDs[userIDs.length - 1]}) ...\n`, results, '\n');

    //8) Shutdown MeshData
    await MeshData.shutdown();

    console.log('\n* shutting down...press ctrl+c to exit early\n');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
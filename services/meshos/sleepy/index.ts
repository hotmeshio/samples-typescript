import Redis from 'ioredis';
import { MeshOS } from '@hotmeshio/pluck';

import config from '../../../config';

export class MySleepyClass extends MeshOS {

  redisClass = Redis;

  redisOptions = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DATABASE,
  };

  workflowFunctions = ['sleep'];
  hookFunctions = ['update'];
  proxyFunctions = ['sleepy'];

  async sleep(name: string): Promise<string> {
    const receipt = await this.update(name);
    console.log('receipt =>', receipt);

    await MeshOS.MeshOS.sleep('21 seconds');

    const search = await MeshOS.MeshOS.search();
    console.log('name =>', await search.get('name'));
    return await this.sleepy(name);
  }

  async sleepy(name: string): Promise<string> {
    return `Hi, Sleepy ${name}!`;
  }

  async update(name: string): Promise<void> {
    const search = await MeshOS.MeshOS.search();
    await search.set('name', name);
  }
}
  
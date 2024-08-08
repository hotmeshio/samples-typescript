import { MeshData, Types, HotMesh } from '@hotmeshio/hotmesh';

import config from '../../../../config';
import { testCount } from '../../../../modules/utils';
import { TestInput } from '../../../../types/test';
import { BaseEntity } from '../../base';

import { schema as TestSchema } from './schema';
import * as workflows from './workflows'

/**
 * The 'Test' entity.
 * 
 */
class Test extends BaseEntity {

  getTaskQueue(): string {
    return 'v1';
  }

  getEntity(): string {
    return 'test';
  }

  getSearchOptions(): Types.WorkflowSearchOptions {
    return {
      index: `${this.getNamespace()}-${this.getEntity()}`,
      prefix: [this.getEntity()],
      schema: TestSchema,
    };
  }

  async connect(counts: { 'test': number, 'test.transitive': number } = { 'test': config.TEST_WORKER_COUNT, 'test.transitive': 1 }) {
    for (let i = 0; i < counts[this.getEntity()]; i++) {
      await this.deployWorker();
      //deploy an extra engine for each worker just for fun
      // (demonstrates how to increase engine points of presence)
      await this.deployEngine();
    }
  }

  async deployEngine() {
    await HotMesh.init({
      appId: this.getNamespace(),
      engine: {
        //re-use the same Redis connection
        redis: await this.meshData.getConnection(),
      }
    });
    return { status: 'success', type: 'worker' };
  }

  async deployWorker() {
    await this.meshData.connect({
      entity: this.getEntity(),
      target: workflows.startTest,
      options: {
        namespace: this.getNamespace(),
        taskQueue: 'v1',
      },
    });
    return { status: 'success', type: 'worker' };
  }

  /**
   * Start a test (recursive) workflow
   */
  async start({ type, width = 1, depth = 1, memo = '-1', wait = true, database }: TestInput): Promise<{ id: string, expectedCount: number }> {
    const timestamp = Date.now();
    const id = `tst${timestamp}`;

    // max concurrent workflows (Promise length) is set at 25
    if (width > 25) {
      width = 25;
    }

    const expectedCount = testCount(width, depth, type);
    if (expectedCount > config.MAX_FLOWS_PER_TEST) {
      throw new Error(`Final test count exceeds ${config.MAX_FLOWS_PER_TEST}(ok)/1,000,000(batch) workflow max. Reduce width and/or depth.`);
    }

    // Run the Test workflow (it's recursive, and calls itself `width^depth` times)
    this.meshData.exec<string>({
      entity: this.getEntity(),
      args: [{ id, type, timestamp, width, depth, wait, memo, database }],
      options: {
        id,
        ttl: '1 hour',
        namespace: this.getNamespace(),
        taskQueue: 'v1',
        signalIn: false,
      },
    });

    return { id, expectedCount };
  }
}

export { Test, MeshData };

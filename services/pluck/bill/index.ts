import { StringStringType, WorkflowSearchOptions } from '@hotmeshio/pluck/build/types';
import config from '../../../config';
import { MeshOS, Pluck, Redis } from '../config';

/**
 * The 'Bill' entity. Shows how Redis-backed governance is able to
 * create durable, transactional workflows using a reentrant
 * process architecture. While the main function stays open and
 * is actively part of the operational data layer (ODL), hook functions
 * can be interleaved that transactionally update primary state.
 * 
 */
class Bill {
  //the entity type (i.e., 'bill' table)
  entity = 'bill';

  //bill entity field names
  fields = ['$entity', 'id', 'user_id', 'timestamp', 'plan', 'cycle', 'discount', 'amount', 'memo'];

  //the RediSearch schema (used for search/indexing)
  search: WorkflowSearchOptions = {
    schema: {
      id: { type: 'TAG', sortable: true },
      user_id: { type: 'TAG', sortable: true },
      plan: { type: 'TAG', sortable: true },
      cycle: { type: 'TAG', sortable: true },
      timestamp: { type: 'NUMERIC', sortable: true },
      amount: { type: 'NUMERIC', sortable: true }, //pennies
      discount: { type: 'NUMERIC', sortable: true },
    },
    index: this.entity,
    prefix: [this.entity],
  };

  //initialize Redis, including RediSearch configuration
  pluck = new Pluck(
    Redis, 
    {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD,
      db: config.REDIS_DATABASE,
    },
    undefined,
    this.search
  );

//******************* ON-CONTAINER-STARTUP COMMANDS ********************

  /**
   * Operationalize important functions
   */
  async connect() {
    this.pluck.connect({
      entity: this.entity,
      target: this.workflow.create,
      options: { ttl: 'infinity' }
    });

    this.pluck.connect({
      entity: `${this.entity}.reconcile`,
      target: this.workflow.reconcile
    });
  } 

  /**
   * Create the search index
   */
  async index() {
    await this.pluck.createSearchIndex(
      this.entity,
      undefined,
      this.search
    );
  }

//******************* ON-CONTAINER-SHUTDOWN COMMANDS ********************

  async shutdown() {
    await MeshOS.stopWorkers();
  }

//********** STANDARD BILL METHODS (CREATE, FIND, ETC) ******************

  /**
   * Retrieve Bill
   */
  async retrieve(id: string) {
    return await this.pluck.get(this.entity, id, { fields: this.fields });
  }

  /**
   * Find bills WHERE
   */
  async find(query: { field: string, is: '=' | '[]' | '>=' | '<=', value: string}[], start = 0, size = 100): Promise<{ count: number; query: string; data: StringStringType[]; }> {
    //NOTE: email is a TAG type. When searching, escape as follows: a\.b\@c\.com
    const response = await this.pluck.findWhere(
      this.entity, 
      { query,
        return: this.fields,
        limit: { start, size}
      },
    ) as { count: number; query: string; data: StringStringType[]; };
    return response;
  }

  /**
   * Count bills WHERE
   */
  async count(query: { field: string, is: '=' | '[]' | '>=' | '<=', value: string}[]): Promise<number> {
    return await this.pluck.findWhere(this.entity, { query, count: true }) as number;
  }

  async reconcile(id: string) {
    console.log('call exec(bill.reconcile) to start the transaction!')
    //todo: add logic to reconcile a bill (call reconciling hook)
  }

//*************** WORKFLOW-ORIENTED METHODS (DATA IN MOTION) *************

  workflow = {

    //send a bill
    async create({ id, user_id, plan, cycle, amount, discount }): Promise<string> {
      const search = await Pluck.workflow.search();
      await search.set(
        '$entity', 'bill',
        'id', id,
        'user_id', user_id,
        'plan', plan,
        'cycle', cycle,
        'amount', amount || '555',
        'discount', discount || '0'
      );
      //do work...proxy the activity worker, so it runs exactly once.
      return id;
    },

    async reconcile() {
      //todo: fix billing issues (transactional)
    }
  }
}

const bill = new Bill();

export { bill as Bill, Pluck };

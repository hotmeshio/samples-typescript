import { StringStringType, WorkflowSearchOptions } from '@hotmeshio/pluck/build/types';
import config from '../../../config';
import { Pluck, Redis, MeshOS } from '../config';
import { nanoid } from 'nanoid';

/**
 * The 'User' entity. Shows how Redis-backed governance is able to
 * create durable, transactional workflows using a reentrant
 * process architecture. While the main function stays open and
 * is actively part of the operational data layer (ODL), hook functions
 * can be interleaved that transactionally update primary state.
 * 
 */
class User {
  //the entity type (i.e., 'user' table)
  entity = 'user';

  //user entity field names
  fields = ['$entity', 'id', 'first', 'last', 'email', 'active', 'cycle', 'plan', 'discount'];

  //the RediSearch schema (used for search/indexing)
  search: WorkflowSearchOptions = {
    schema: {
      id: { type: 'TEXT', sortable: true },
      first: { type: 'TEXT', sortable: true },
      last: { type: 'TEXT', sortable: true },
      email: { type: 'TAG', sortable: true },
      active: { type: 'TAG', sortable: true },
      plan: { type: 'TAG', sortable: true },
      cycle: { type: 'TAG', sortable: true }
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
   * Connect transactional functions
   */
  async connect() {
    this.pluck.connect({
      entity: this.entity,
      target: this.workflow.create,
      options: { ttl: 'infinity' }
    });

    this.pluck.connect({
      entity: `${this.entity}.bill`,
      target: this.workflow.bill
    });

    this.pluck.connect({
      entity: `${this.entity}.notify`,
      target: this.workflow.notify
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

//********** STANDARD USER METHODS (CREATE, FIND, ETC) ******************

  /**
   * Create User
   */
  async create(body: Record<string, any>) {
    const { id, email, first, last, plan, cycle } = body;
    //call `pluck.exec` to add the user to the operational data layer (ODL)
    await this.pluck.exec<string>({
      entity: this.entity,
      args: [this.entity, id],
      options: { id,
        search: {
          data: {
            '$entity': this.entity,
            active: 'true',
            id,
            email,
            first,
            last,
            plan,
            cycle,
            discount : '0',
          }
        }
      }
    });

    //echo the job state (the created user)
    return await this.retrieve(id);
  }

  /**
   * Retrieve User
   * @param id
   * @returns
   * @throws
   */
  async retrieve(id: string) {
    const user = await this.pluck.get( this.entity, id, { fields: this.fields });
    if (!user?.id) throw new Error('User not found');
    return user;
  }

  /**
   * Update User
   */
  async update(id: string, body: Record<string, any>) {
    await this.retrieve(id);
    await this.pluck.set(this.entity, id, { search: { data: body }});
    return await this.retrieve(id);
  }

  /**
   * Bill User; Update Profile and start Billing Hook
   */
  async bill(id: string, data: Record<string, any>) {
    await this.retrieve(id);
    //update the user
    const { active } = await this.pluck.get(this.entity, id, { fields: ['active'] });
    if (data.active === 'true') {
      await this.pluck.set(this.entity, id, { search: { data }});
      //start the billing hook if not already active
      if (active !== 'true') {
        await this.pluck.hook({
          entity: this.entity,
          id,
          hookEntity: `${this.entity}.bill`,
          hookArgs: [data.plan, data.cycle, {}, {}]
        });
      }
    } else {
      this.pluck.set(this.entity, id, { search: { data: { active: 'false' }}});
    }
    return await this.retrieve(id);
  }

  /**
   * Delete User
   */
  async delete(id: string) {
    //user will be fully removed within 2 minutes
    await this.retrieve(id);
    await this.pluck.flush(this.entity, id);
    return true;
  }

  /**
   * Find users WHERE
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
   * Count users WHERE
   */
  async count(query: { field: string, is: '=' | '[]' | '>=' | '<=', value: string}[]): Promise<number> {
    return await this.pluck.findWhere(this.entity, { query, count: true }) as number;
  }

//*************** WORKFLOW-ORIENTED METHODS (DATA IN MOTION) *************

  workflow = {

    async create(entity: string, id: string): Promise<string> {
      await Pluck.workflow.hook({
        entity: `${entity}.bill`,
        args: ['starter', 'monthly', {}],
      });
      return id;
    },

    async bill(plan: string, cycle: string, options: Record<any, string> = {}) {
      const search = await Pluck.workflow.search();
      while(await search.get('active') === 'true') {
        const [user_id, amount, discount] = await search.mget('id', 'amount', 'discount');
        const id = `bill-${nanoid()}`;
        await Pluck.workflow.executeChild({
          entity: 'bill',
          args: [{
            id, user_id, plan, cycle, amount,
            discount, timestamp: Date.now()
          }],
        });
        await Pluck.workflow.sleep('1 minute');
      };
    },

    async notify(channel: string, options: Record<any, string>) {
      //set up recurring notifications
    }
  }
}

const user = new User();

export { user as User, Pluck };

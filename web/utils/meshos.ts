import * as Redis from 'redis';
import { Pool, Client as PGClient } from 'pg';
import { connect as NATS } from 'nats';
import { MeshOS } from '@hotmeshio/hotmesh';

// Import entity classes
import { Bill } from '../../meshdata/namespaces/sandbox/bill';
import { Test } from '../../meshdata/namespaces/sandbox/test';
import { User } from '../../meshdata/namespaces/sandbox/user';
import { Order as BillingOrder } from '../../meshdata/namespaces/billing/order';
import { Order as RoutingOrder } from '../../meshdata/namespaces/routing/order';
import { Inventory } from '../../meshdata/namespaces/inventory';
import { DefaultEntity } from '../../meshdata/namespaces/default';

// Import entity schemas
import { schema as BillingOrderSchema } from '../../meshdata/namespaces/billing/order/schema';
import { schema as RoutingOrderSchema } from '../../meshdata/namespaces/routing/order/schema';
import { schema as SandboxUserSchema } from '../../meshdata/namespaces/sandbox/user/schema';
import { schema as SandboxBillSchema } from '../../meshdata/namespaces/sandbox/bill/schema';
import { schema as SandboxTestSchema } from '../../meshdata/namespaces/sandbox/test/schema';
import { schema as InventorySchema } from '../../meshdata/namespaces/inventory/schema';
import { schema as DefaultSchema } from '../../meshdata/namespaces/default/schema';

const USE_REDIS = process.env.USE_REDIS !== 'false';
const USE_DRAGONFLY = process.env.USE_DRAGONFLY === 'true';
const USE_VALKEY = process.env.USE_VALKEY === 'true';
const USE_POSTGRES = process.env.USE_POSTGRES === 'true';

//use a connection pool for Postgres
// const PostgresPoolClient = new Pool({
//   connectionString: 'postgresql://postgres:password@postgres:5432/hotmesh'
// });

export const databases = {
  redis: !USE_REDIS ? undefined: {
    name: 'Redis',
    label: 'redis/redis-stack7.2.0',
    search: true,
    connection: {
      class: Redis,
      options: {
        url: 'redis://:key_admin@redis:6379'
      }
    },
  },
  postgres: !USE_POSTGRES ? undefined: {
    name: 'Postgres',
    label: 'postgres:latest',
    search: false,
    connection: {
      store: {
        class: PGClient,
        options: {
          connectionString: 'postgresql://postgres:password@postgres:5432/hotmesh'
        }
      },
      stream: {
        class: PGClient,
        options: {
          connectionString: 'postgresql://postgres:password@postgres:5432/hotmesh'
        }
      },
      sub: {
        class: NATS,
        options: { servers: ['nats:4222'] }
      },
    },
  },
  valkey: !USE_VALKEY ? undefined: {
    name: 'ValKey',
    label: 'ValKey',
    search: false,
    connection: {
      class: Redis,
      options: {
        url: 'redis://:key_admin@valkey:6379'
      }
    },
  },
  dragonfly: !USE_DRAGONFLY ? undefined: {
    name: 'DragonflyDB',
    label: 'DragonflyDB',
    search: true,
    connection: {
      class: Redis,
      options: {
        url: 'redis://:key_admin@dragonflydb:6379'
      }
    },
  },
};

const entities = {
  'billing-order': {
    name: 'order',
    label: 'Order',
    schema: BillingOrderSchema,
    class: BillingOrder,
  },
  'routing-order': {
    name: 'order',
    label: 'Order',
    schema: RoutingOrderSchema,
    class: RoutingOrder,
  },
  'sandbox-user': {
    name: 'user',
    label: 'User',
    schema: SandboxUserSchema,
    class: User,
  },
  'sandbox-bill': {
    name: 'bill',
    label: 'Bill',
    schema: SandboxBillSchema,
    class: Bill,
  },
  'sandbox-test': {
    name: 'test',
    label: 'Test',
    schema: SandboxTestSchema,
    class: Test,
  },
  'inventory': {
    name: 'inventory',
    label: 'Inventory',
    schema: InventorySchema,
    class: Inventory,
  },
  'default': {
    name: 'default',
    label: 'Default',
    schema: DefaultSchema,
    class: DefaultEntity,
  },
};

const namespaces = {
  sandbox: {
    name: 'Sandbox',
    type: 'sandbox',
    label: 'Sandbox Playground',
    entities: [entities['sandbox-user'], entities['sandbox-bill'], entities['sandbox-test']],
  },
  /*routing: {
    name: 'Routing',
    type: 'routing',
    label: 'Order Routing',
    entities: [entities['routing-order']],
  },
  billing: {
    name: 'Billing',
    type: 'billing',
    label: 'Order Billing',
    entities: [entities['billing-order']],
  },
  inventory: {
    name: 'Inventory',
    type: 'inventory',
    label: 'Inventory',
    entities: [entities['inventory']],
  },*/
  meshdata: {
    name: 'MeshData Demo',
    type: 'meshdata',
    label: 'MeshData Demo',
    entities: [entities['default']],
  },
  meshflow: {
    name: 'MeshFlow Demo',
    type: 'meshflow',
    label: 'MeshFlow Demo',
    entities: [entities['default']],
  },
};

// Utility function to configure MeshOS with multiple databases, namespaces, and entities
export const configureHotMesh = () => {
  Object.keys(databases).forEach((dbKey) => {
    const db = databases[dbKey];
    MeshOS.registerDatabase(dbKey, db);

    Object.keys(namespaces).forEach((nsKey) => {
      const ns = namespaces[nsKey];
      MeshOS.registerNamespace(nsKey, ns);
      ns.entities.forEach((entity) => {
        MeshOS.registerEntity(entity.type, entity);
      });
    });

    MeshOS.registerProfile(dbKey, {
      db: MeshOS.databases[dbKey],
      namespaces: Object.keys(namespaces).reduce((acc, nsKey) => {
        acc[nsKey] = MeshOS.namespaces[nsKey];
        return acc;
      }, {}),
    });
  });

  MeshOS.registerClass('default', DefaultEntity);
  MeshOS.registerClass('sandbox-user', User);
  MeshOS.registerClass('sandbox-bill', Bill);
  MeshOS.registerClass('sandbox-test', Test);
  MeshOS.registerClass('billing-order', BillingOrder);
  MeshOS.registerClass('routing-order', RoutingOrder);
  MeshOS.registerClass('inventory', Inventory);

  MeshOS.registerSchema('default', DefaultSchema);
  MeshOS.registerSchema('billing-order', BillingOrderSchema);
  MeshOS.registerSchema('routing-order', RoutingOrderSchema);
  MeshOS.registerSchema('sandbox-user', SandboxUserSchema);
  MeshOS.registerSchema('sandbox-bill', SandboxBillSchema);
  MeshOS.registerSchema('sandbox-test', SandboxTestSchema);
  MeshOS.registerSchema('inventory', InventorySchema);
};

export const initializeHotMesh = async () => {
  configureHotMesh();
  await MeshOS.init();
};

// Utility function to find entity instance by database, namespace, and entity name
export const getEntityInstance = (database: string, namespace: string, entity: string) => {
  return MeshOS.findEntity(database, namespace, entity);
};

// Utility function to get schemas
export const getSchemas = (database: string, namespace: string) => {
  return MeshOS.findSchemas(database, namespace);
};

// Utility function to get JSON representation of profiles
export const getProfilesJSON = () => {
  return MeshOS.toJSON();
};

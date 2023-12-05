import { WorkflowSearchOptions } from '@hotmeshio/hotmesh/build/types';

import { MeshOSConfig } from './config';

/**
 * An Order Inventory class. This is an example
 * of a class that would be used to manage inventory
 * for high-volume, high-concurrency use.
 * 
 * As long as the 'create' method is running,
 * the record is open and can be updated by
 * other methods.
 * 
 * The FT search index is created at the time
 * the workers are started.
 */
export class OrderInventory extends MeshOSConfig {

  taskQueue: string = 'inventory';

  search: WorkflowSearchOptions = {
    index: 'inventory-orders',
    prefix: ['ord_'],
    schema: {
      quantity: {
        type: 'NUMERIC', // | TEXT
        sortable: true
      },
      status: {
        type: 'TAG',
        sortable: true
      }
    }
  };

  workflowFunctions = ['create'];
  hookFunctions = ['setStatus', 'incrQuantity', 'setQuantity'];

  /**
   * main workflow function; while running, the record is open
   * and can be updated by other hook functions
   */
  async create(quantity: number): Promise<{quantity: number, status: string}> {
    await this.setQuantity(quantity, 'available');

    //use 'waitForSignal' to leave open indefinitely
    await OrderInventory.MeshOS.sleep('11 seconds');

    //return (the order will now self-delete)
    const search = await OrderInventory.MeshOS.search();
    const [remaining, status] = await Promise.all([
      search.get('quantity'),
      search.get('status')
    ]);
    return { quantity: Number(remaining), status };
  }

  /**
   * increment (or decrement) the quantity
   */
  async incrQuantity(quantity: number): Promise<void> {
    const search = await OrderInventory.MeshOS.search();

    if (await search.get('status') === 'available') {
      const amount = await search.incr('quantity', quantity);
      if (amount <= 0) {
        await this.setStatus('depleted');
      }
    }
  }

  /**
   * set the quantity (and optionally the
   * status) when setting the initial order value)
   */
  async setQuantity(quantity: number, status?: string): Promise<void> {
    const search = await OrderInventory.MeshOS.search();
    await search.set('quantity', quantity.toString());
    if (status) {
      await this.setStatus(status);
    }
  }

  /**
   * update the inventory order status
   */
  async setStatus(status: string): Promise<void> {
    const search = await OrderInventory.MeshOS.search();
    await search.set('status', status);
  }
}

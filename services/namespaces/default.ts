import { BaseEntity } from './base';
import { Types } from '@hotmeshio/hotmesh';

class DefaultEntity extends BaseEntity {

    protected getTaskQueue(): string {
        return 'v1';
    }

    protected getEntity(): string {
        return 'default';
    }

    getSearchOptions(): Types.WorkflowSearchOptions {
        return {
            index: `${this.getNamespace()}-${this.getEntity()}`,
            prefix: [this.getEntity()],
            schema: {
                $entity: {
                    type: 'TAG',
                    indexed: false,
                    primitive: 'string',
                    required: true,
                },
                id: {
                    type: 'TAG',
                    sortable: false,
                },
            },
        };
    }
}

export { DefaultEntity };

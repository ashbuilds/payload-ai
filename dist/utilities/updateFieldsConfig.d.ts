import type { CollectionConfig, GlobalConfig } from 'payload';
interface UpdateFieldsConfig {
    schemaPathMap: Record<string, string>;
    updatedCollectionConfig: CollectionConfig | GlobalConfig;
}
export declare const updateFieldsConfig: (collectionConfig: CollectionConfig | GlobalConfig) => UpdateFieldsConfig;
export {};

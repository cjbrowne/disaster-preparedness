import BaseModel from '@/models/BaseModel';

export enum Inventory {
    EDC,
    GO_BAG,
    STORAGE,
}

export interface InventoryItem extends BaseModel {
    inventory: Inventory,
    name: string,
    quantity: number,
}

export const INVENTORY_ITEM_ENDPOINT = 'item';

export default InventoryItem;

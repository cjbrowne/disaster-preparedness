import _ from 'lodash';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuid } from 'uuid';

interface CacheItem<T> {
    id: string;
    value: T;
    storage_time: Date;
}

interface BaseModel {
    generateId(): typeof uuid;
}

// don't try to flush more than 50 items at once from the create queue
const MAX_CREATE_QUEUE_ITEMS_PER_FLUSH = 50;

/*
pseudocode on create:
 - generate UUID
 - make new create action, add to actions queue
 - save new item to in-memory cache
 - save new item in localStorage
pseudocode on delete:
 - make new delete action, add to actions queue
 - delete item from in-memory cache
 - delete item from localStorage
pseudocode on update:
 - make new update action, add to actions queue
 - update item in in-memory cache
 - update item in localStorage
pseudocode on read:
 - fetch item from in-memory cache

pseudocode on action queue entry add:
 - add item to in-memory queue
 - persist in-memory queue

pseudocode on action queue flush:
 - remove item from in-memory queue
 - process API request
 - on success, remove item from localstorage
 - on failure, put item back in in-memory queue

pseudocode on sync:
 - flush actions queue to API
 - load lastUpdated from localStorage
 - fetch all updates since lastUpdated
 - apply all updates to in-memory/localStorage tiers
 - save lastUpdated (Date.now()) to localStorage
 */


export class CachingRepository<T extends BaseModel> {

    private readonly createQueue: T[];

    private cache: Record<string, CacheItem<T>>;
    private http: AxiosInstance;

    constructor(baseURL: string) {
        this.cache = {};
        this.createQueue = [];
        this.http = axios.create({
            baseURL
        });
    }

    findById(key: string): T | undefined {
        return _.get(this.cache, key)?.value;
    }

    findAll(): T[] {
        return [..._.chain(this.cache).values().map('value').value(), ...this.createQueue];
    }

    set(id: typeof uuid, value: T) {
        return _.set(this.cache, id.toString(), value);
    }

    add(value: T) {
        const id = value.generateId();
        _.set(this.cache, id.toString(), value);
    }

    delete(id: typeof uuid) {

    }

    sync() {
        // first, sync with local storage
        _.each(this.cache, (v: CacheItem<T>, k: string) => {
            localStorage.setItem(k, JSON.stringify(v));
        });
    }

    private flushCreateQueue(stackDepth: number) {
        if (this.createQueue.length > 0 && stackDepth < MAX_CREATE_QUEUE_ITEMS_PER_FLUSH) {
            // take an element from the head of the queue
            // note the pointless typecast - thank TypeScript's rather quirky type system for that one
            const newEntity = this.createQueue.shift() as T;

            this.http.post('', newEntity).then(res => {
                if (res.status > 200 && res.status < 299) {

                } else {
                    // put the entity back on the queue so it gets retried later
                    this.createQueue.push(newEntity);
                }
            });

            this.flushCreateQueue(stackDepth + 1);
        }
    }
}

export default CachingRepository;
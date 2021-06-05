import _ from 'lodash';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuid } from 'uuid';
import { eventBus } from '@/main';
import { ErrorCode } from '@/util/error_codes';
import BaseModel from '@/models/BaseModel';

interface CacheItem<T> {
    id: string;
    value: T;
    storage_time: Date;
}

// don't try to flush more than 50 items at once from the create queue
const MAX_QUEUE_ITEMS_PER_FLUSH = 50;
const MAX_ERRORS_BEFORE_LATCH = 3;

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

enum Action {
    UPDATE,
    DELETE,
}

interface ActionQueueItem<T extends BaseModel> {
    action: Action;
    id: string;
    value: T | null; // for DELETE actions, value should be null
    requested: Date;
}

function *idGenerator(): Generator<string, string, string> {
    while(true) {
        yield uuid();
    }
}

export class CachingRepository<T extends BaseModel> {

    private readonly actionQueue: ActionQueueItem<T>[];

    private readonly cache: Record<string, CacheItem<T>>;
    private http: AxiosInstance;
    private errorLatch: boolean;

    constructor(baseURL: string, token: string, private cacheKeyPrefix: string = '') {
        const localStorageCache = localStorage.getItem([cacheKeyPrefix, 'cache'].join('.'))
        if ( localStorageCache !== null ) {
            this.cache = JSON.parse(localStorageCache);
        } else {
            this.cache = {};
        }
        this.actionQueue = [];
        this.http = axios.create({
            baseURL
        });
        setInterval(async () => {
            await this.sync();
        }, 500);
        this.errorLatch = false;
    }

    async findById(key: string): Promise<T | undefined> {
        return _.get(this.cache, key)?.value;
    }

    async findAll(): Promise<T[]> {
        return _.chain(this.cache).values().map('value').value();
    }

    async create(value: T): Promise<T> {
        const id = idGenerator().next().value;
        value.id = id;
        return this.update(id, value);
    }

    async update(id: string, value: T): Promise<T> {
        this.actionQueue.push({
            action: Action.UPDATE,
            id,
            requested: new Date(),
            value
        });
        _.set<CacheItem<T>>(this.cache, id, {
            id,
            value,
            storage_time: new Date()
        } as CacheItem<T>);
        return value;
    }

    async delete(id: string) {
        this.actionQueue.push({
            action: Action.DELETE,
            id,
            requested: new Date(),
            value: null,
        });
        _.unset(this.cache, id);
        console.log(`Deleting ${id}`, this.cache);
    }

    async sync() {
        // first, sync cache with local storage
        localStorage.setItem([this.cacheKeyPrefix, 'cache'].join('.'), JSON.stringify(this.cache));
        // flush action queue to API
        await this.flushActionQueue(0, 0);
        // fetch actions to unwind onto our own data
        
        // prompt user to resolve any conflicts
    }

    private async flushActionQueue(stackDepth: number, errorCount: number) {
        if(errorCount > MAX_ERRORS_BEFORE_LATCH) {
            this.errorLatch = true;
        }
        if (!this.errorLatch && this.actionQueue.length > 0 && stackDepth < MAX_QUEUE_ITEMS_PER_FLUSH) {
            // take an element from the head of the queue
            const action = this.actionQueue.shift() as ActionQueueItem<T>;

            await this.http.post('actions', action).then(res => {
                // note: only retry 5xx errors
                if (res.status > 500 && res.status < 599) {
                    // put the entity back on the queue so it gets retried later
                    this.actionQueue.push(action);
                } else if (res.status > 400 && res.status < 499) {
                    errorCount++;
                    eventBus.$emit('error', {
                        code: ErrorCode.E_SYNCFAILED,
                        message: 'Could not sync action with backend',
                        action,
                        reason: res.data,
                    })
                }
            }).catch((e) => {
                errorCount++;
                // retry action later if an error occurred
                this.actionQueue.push(action);
            });

            await this.flushActionQueue(stackDepth + 1, errorCount);
        }
    }
}

export default CachingRepository;

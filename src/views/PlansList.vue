<template>
    <div class='plans-list'>
        <v-data-table
            :headers='headers'
            :items='plans'
            :items-per-page='5'
            v-on:click:row='navigateToPlan'
        >
            <template v-slot:item.linkedScenarios='{ item }'>
                {{ $_.map(item.linkedScenarios, 'name').join(',') }}
            </template>
            <template v-slot:top>
                <v-toolbar
                    flat
                >
                    <v-toolbar-title>{{ $tc('generic.plan', 2) }}</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-dialog
                        v-model='dialog'
                        max-width='500px'
                    >
                        <template v-slot:activator='{ on, attrs }'>
                            <v-btn
                                color='primary'
                                dark
                                class='mb-2'
                                v-bind='attrs'
                                v-on='on'
                            >
                                {{ $t('plans.new') }}
                            </v-btn>
                        </template>
                        <v-card>
                            <v-card-title>
                                <span class='headline'>{{ formTitle }}</span>
                            </v-card-title>

                            <v-card-text>
                                <v-container>
                                    <v-row>
                                        <v-col
                                            cols='12'
                                            sm='12'
                                            md='12'
                                        >
                                            <v-text-field
                                                v-model='editedItem.name'
                                                :label="[$tc('generic.plan', 1), $t('generic.name')].join(' ')"
                                            ></v-text-field>
                                        </v-col>
                                        <v-col
                                            cols='12'
                                            sm='12'
                                            md='12'
                                        >
                                            <v-textarea
                                                v-model='editedItem.description'
                                                :label="$t('generic.description')"
                                            ></v-textarea>
                                        </v-col>
                                        <v-col
                                            cols='12'
                                            sm='12'
                                            md='12'
                                        >
                                            <v-select
                                                v-model='editedItem.linkedScenarios'
                                                multiple=true
                                                :items='scenarios'
                                            ></v-select>
                                        </v-col>
                                    </v-row>
                                </v-container>
                            </v-card-text>

                            <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn
                                    color='blue darken-1'
                                    text
                                    @click='close'
                                >
                                    {{ $t('actions.cancel') }}
                                </v-btn>
                                <v-btn
                                    color='blue darken-1'
                                    text
                                    @click='save'
                                >
                                    {{ $t('actions.save') }}
                                </v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-dialog>
                    <v-dialog v-model='dialogDelete' max-width='500px'>
                        <v-card>
                            <v-card-title class='headline'>Are you sure you want to delete this item?</v-card-title>
                            <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn color='blue darken-1' text @click='closeDelete'>Cancel</v-btn>
                                <v-btn color='blue darken-1' text @click='deleteItemConfirm'>OK</v-btn>
                                <v-spacer></v-spacer>
                            </v-card-actions>
                        </v-card>
                    </v-dialog>
                </v-toolbar>
            </template>
            <template v-slot:item.actions='{ item }'>
                <v-icon
                    small
                    class='mr-2'
                    @click='editItem(item)'
                >
                    mdi-pencil
                </v-icon>
                <v-icon
                    small
                    @click='deleteItem(item)'
                >
                    mdi-delete
                </v-icon>
            </template>
            <template v-slot:no-data>
                {{ $t('plans.no-rows') }}
            </template>
        </v-data-table>
    </div>
</template>

<script>
import { shtfpApi } from '@/util/shtfp-api';
import axios from 'axios';
import _ from 'lodash';

export default {
    name: 'plansList',
    data() {
        return {
            plans: [],
            scenarios: [],
            headers: [
                {
                    text: 'Name',
                    value: 'name',
                },
                {
                    text: 'Linked Scenarios',
                    value: 'linkedScenarios',
                },
                {
                    text: 'Actions',
                    value: 'actions',
                    sortable: false,
                },
            ],
            error: null,
            dialog: false,
            dialogDelete: false,
            editedIndex: -1,
            editedItem: {
                name: '',
                description: '',
                linkedScenarios: [],
                planId: '',
            },
            defaultItem: {
                name: '',
                description: '',
                linkedScenarios: [],
                planId: '',
            },
        };
    },
    computed: {
        formTitle() {
            return this.editedIndex === -1 ? 'New plan' : 'Edit plan';
        },

    },
    created() {
        shtfpApi.get('plans?projection=planProjection')
            .then(response => {
                this.plans = response.data._embedded.plans;
            })
            .catch(e => {
                this.error = e;
            });
        shtfpApi.get('scenarios')
            .then(response => {
                this.scenarios = _.map(response.data._embedded.scenarios, sc => ({
                    text: sc.name,
                    value: {scenarioId: sc.scenarioId}
                }));
            }).catch(e => {
            this.error = e;
        });
    },
    methods: {
        close() {
            this.dialog = false;
            this.$nextTick(() => {
                this.editedItem = Object.assign({}, this.defaultItem);
                this.editedIndex = -1;
            });
        },
        save() {
            const onSave = res => {
                if (res.status >= 200 && res.status <= 299) {
                    console.log(res);
                    if (res.config.method === 'post') {
                        this.plans.push(res.data);
                    } else {
                        Object.assign(this.plans.find(x => x.planId === res.data.planId), res.data);
                    }
                    this.close();
                }
            };

            if (this.editedItem.planId !== '') {
                shtfpApi.put(`plans/${this.editedItem.planId}`, this.editedItem).then(onSave);
            } else {
                shtfpApi.post('plans', this.editedItem).then(onSave);
            }
        },
        editItem(item) {
            this.editedIndex = this.plans.indexOf(item);
            this.editedItem = Object.assign({}, item);
            this.dialog = true;
        },
        deleteItem(item) {
            console.log(item);
            this.editedIndex = this.plans.indexOf(item);
            this.editedItem = Object.assign({}, item);
            this.dialogDelete = true;
        },
        closeDelete() {
            this.dialogDelete = false;
            this.$nextTick(() => {
                this.editedItem = Object.assign({}, this.defaultItem);
                this.editedIndex = -1;
            });
        },
        deleteItemConfirm() {
            if (this.editedItem._links) {
                axios.delete(this.editedItem._links.self.href);

                this.plans.splice(this.editedIndex, 1);
                this.closeDelete();
            } else {
                // todo: error handling (kek)
            }
        },
        navigateToPlan(evt, { item }) {
            console.log(item);
        },
    },
};
</script>

<style scoped>
.plans-list {
    padding: 2rem;
}
</style>
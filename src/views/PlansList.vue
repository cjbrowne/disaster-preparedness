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
                                                multiple='true'
                                                :items='scenarioOptions'
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
import { getRepository } from '@/util/repositories';
import _ from 'lodash';
import Plan, { PLAN_ENDPOINT } from '@/models/Plan';
import Scenario, { SCENARIO_ENDPOINT } from '@/models/Scenario';

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
                id: '',
            },
            defaultItem: {
                name: '',
                description: '',
                linkedScenarios: [],
                id: '',
            },
        };
    },
    computed: {
        formTitle() {
            return this.editedIndex === -1 ? 'New plan' : 'Edit plan';
        },
        scenarioOptions() {
            return _.map(this.scenarios, scenario => ({
                text: scenario.name,
                value: scenario,
            }));
        }
    },
    created() {
        const planRepository = getRepository(PLAN_ENDPOINT, Plan);
        const scenariosRepository = getRepository(SCENARIO_ENDPOINT, Scenario);
        planRepository.findAll()
            .then(plans => {
                this.plans = plans;
            })
            .catch(e => {
                this.error = e;
            });

        scenariosRepository.findAll()
            .then(scenarios => {
                this.scenarios = scenarios;
            })
            .catch(e => {
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
            const planRepository = getRepository(PLAN_ENDPOINT, Plan);
            const onSave = plan => {
                if (this.plans.find(x => x.id === plan.id)) {
                    Object.assign(
                        this.plans.find(x => x.id === plan.id),
                        plan,
                    );
                } else {
                    this.plans.push(plan);
                }
                this.close();
            };

            if (this.editedItem.id !== '') {
                planRepository.update(this.editedItem.id, this.editedItem).then(onSave);
            } else {
                planRepository.create(this.editedItem).then(onSave);
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
            const planRepository = getRepository(PLAN_ENDPOINT, Plan);
            planRepository.delete(this.editedItem.id);

            this.plans.splice(this.editedIndex, 1);
            this.closeDelete();
        },
        navigateToPlan(evt, { item }) {
            console.log('navigating to item', item);
        },
    },
};
</script>

<style scoped>
.plans-list {
    padding: 2rem;
}
</style>

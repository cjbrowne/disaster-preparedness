<template>
    <div class='scenarios-list'>
        <!--        <h1>Scenarios</h1>-->
        <v-data-table
            :headers='headers'
            :items='scenarios'
            :items-per-page='5'
            v-on:click:row='navigateToScenario'
        >
            <template v-slot:top>
                <v-toolbar
                    flat
                >
                    <v-toolbar-title>Scenarios</v-toolbar-title>
                    <v-divider
                        class='mx-4'
                        inset
                        vertical
                    ></v-divider>
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
                                New Item
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
                                                label='Scenario Name'
                                            ></v-text-field>
                                        </v-col>
                                        <v-col
                                            cols='12'
                                            sm='12'
                                            md='12'
                                        >
                                            <v-textarea
                                                v-model='editedItem.description'
                                                label='Description'
                                            ></v-textarea>
                                        </v-col>
                                        <v-col
                                            cols='12'
                                            sm='6'
                                            md='6'
                                        >
                                            <v-select
                                                v-model='editedItem.impact'
                                                label='Impact'
                                                :items='impactLevels'
                                            >
                                            </v-select>
                                        </v-col>
                                        <v-col
                                            cols='12'
                                            sm='6'
                                            md='6'
                                        >
                                            <v-select
                                                v-model='editedItem.risk'
                                                label='Risk'
                                                :items='riskLevels'
                                            ></v-select>
                                        </v-col>
                                        <v-col
                                            cols='12'
                                            sm='6'
                                            md='6'
                                        >
                                            <v-select
                                                v-model='editedItem.areaOfEffect'
                                                label='Area of Effect'
                                                :items='areaOfEffect'></v-select>
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
                                    Cancel
                                </v-btn>
                                <v-btn
                                    color='blue darken-1'
                                    text
                                    @click='save'
                                >
                                    Save
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
                You haven't created any scenarios yet.
            </template>
        </v-data-table>
    </div>
</template>

<script>
import { shtfpApi } from '@/util/shtfp-api';
import axios from 'axios';

export default {
    name: 'ScenariosList',
    data() {
        return {
            scenarios: [],
            headers: [
                {
                    text: 'Name',
                    value: 'name',
                },
                {
                    text: 'Impact',
                    value: 'impact',
                },
                {
                    text: 'Risk',
                    value: 'risk',
                },
                {
                    text: 'Area of Effect',
                    value: 'areaOfEffect',
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
                impact: 'MINIMAL',
                risk: 'LOW',
                scenarioId: '',
                areaOfEffect: 'PERSONAL',
            },
            defaultItem: {
                name: '',
                description: '',
                impact: 'MINIMAL',
                risk: 'LOW',
                areaOfEffect: 'PERSONAL',
                scenarioId: '',
            },
            impactLevels: [
                'MINIMAL',
                'MINOR',
                'SIGNIFICANT',
                'MAJOR',
                'TEOTWAWKI',
            ],
            areaOfEffect: [
                'PERSONAL',
                'FAMILY',
                'COMMUNITY',
                'REGION',
                'NATION',
                'WORLDWIDE',
            ],
            riskLevels: [
                'LOW',
                'MEDIUM',
                'HIGH',
            ],
        };
    },
    computed: {
        formTitle() {
            return this.editedIndex === -1 ? 'New Scenario' : 'Edit Scenario';
        },
    },
    created() {
        shtfpApi.get('scenarios')
            .then(response => {
                this.scenarios = response.data._embedded.scenarios;
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
            const onSave = res => {
                if (res.status >= 200 && res.status <= 299) {
                    if (res.config.method === 'post') {
                        this.scenarios.push(res.data);
                    } else {
                        Object.assign(this.scenarios.find(x => x.scenarioId === res.data.scenarioId), res.data);
                    }
                    this.close();
                }
            };

            if (this.editedItem.scenarioId !== '') {
                shtfpApi.put(`scenarios/${this.editedItem.scenarioId}`, this.editedItem).then(onSave);
            } else {
                shtfpApi.post('scenarios', this.editedItem).then(onSave);
            }
        },
        editItem(item) {
            this.editedIndex = this.scenarios.indexOf(item);
            this.editedItem = Object.assign({}, item);
            this.dialog = true;
        },
        deleteItem(item) {
            console.log(item);
            this.editedIndex = this.scenarios.indexOf(item);
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

                this.scenarios.splice(this.editedIndex, 1);
                this.closeDelete();
            } else {
                // todo: error handling (kek)
            }
        },
        navigateToScenario(evt, { item }) {
            console.log(item);
        },
    },
};
</script>

<style scoped>
.scenarios-list {
    padding: 2rem;
}
</style>
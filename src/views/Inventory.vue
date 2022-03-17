<template>
<div class="inventory-container">
    <v-dialog
        :v-model='showAddItemModal'
    >

    </v-dialog>
    <!-- todo: refactor this into a component? -->
    <v-card>
        <div class='inventory-header'>
            <v-card-title>
                Everyday Carry
            </v-card-title>
            <v-btn
                color='primary'
                :onclick='addItem'
            >
                Add Item
            </v-btn>
        </div>
    </v-card>
    <v-card>
        <v-card-title>Go Bag</v-card-title>
        <v-btn
            color='primary'
            >
            Add Item
        </v-btn>
    </v-card>
    <v-card>
        <v-card-title>Storage</v-card-title>
    </v-card>
</div>
</template>

<script>
export default {
    name: 'Inventory',
    data: () => ({
        showAddItemModal: false,
    }),
    methods: {
        addItem() {
            this.showAddItemModal = true;
        }
    }
};
</script>

<style scoped>
.inventory-container {
    padding: 3rem;
    display: grid;
    grid-template-columns: auto auto auto;
    grid-column-gap: 1rem;
}
.inventory-header {
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;

}
</style>

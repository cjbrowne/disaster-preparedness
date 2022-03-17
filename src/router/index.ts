import Vue from 'vue';
import VueRouter from 'vue-router';
// @ts-ignore - vue imports into ts files cause webstorm to throw a wobbly
import Dashboard from '@/views/Dashboard';
// @ts-ignore - vue imports into ts files cause webstorm to throw a wobbly
import ScenariosList from '@/views/ScenariosList';
// @ts-ignore - vue imports into ts files cause webstorm to throw a wobbly
import PlansList from '@/views/PlansList';
// @ts-ignore - vue imports into ts files cause webstorm to throw a wobbly
import Inventory from '@/views/Inventory';
import _ from 'lodash';

Vue.use(VueRouter);

Object.defineProperty(Vue.prototype, '$_', { value: _ });

const routes = [
    {
        path: '/',
        name: 'Dashboard',
        component: Dashboard,
    },
    {
        path: '/scenarios',
        name: 'Scenarios',
        component: ScenariosList,
    },
    {
        path: '/plans',
        name: 'Response Plans',
        component: PlansList,
    },
    {
        path: '/inventory',
        name: 'Inventory',
        component: Inventory,
    }
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
});

export default router;

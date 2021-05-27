import Vue from 'vue';
import VueRouter from 'vue-router';
import Dashboard from '@/views/Dashboard';
import ScenariosList from '@/views/ScenariosList';
import PlansList from '@/views/PlansList';
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
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
});

export default router;

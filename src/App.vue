<template>
    <v-app
        dark>
        <v-app-bar
            app
            color='primary'
            dark
        >
            <v-app-bar-nav-icon @click.stop='drawer = !drawer'></v-app-bar-nav-icon>

            <div class='d-flex align-center'>
                <router-link to='/'>
                    <v-img
                        src='//placehold.it/64x64'
                    />
                </router-link>
            </div>

            <v-spacer></v-spacer>

        </v-app-bar>
        <v-navigation-drawer app v-model='drawer'>
            <v-list-item>
                <v-list-item-content>
                    <v-list-item-title class='title'>
                        SHTFP
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        Disaster Preparedness Toolkit
                    </v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>

            <v-divider></v-divider>

            <v-list
                dense
                nav
            >
                <v-list-item
                    v-for='item in items'
                    :key='item.title'
                    link
                    :to='item.path'
                >
                    <v-list-item-icon>
                        <v-icon>{{ item.icon }}</v-icon>
                    </v-list-item-icon>

                    <v-list-item-content>
                        <v-list-item-title>
                            {{ item.title }}
                        </v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>
        <v-main>
            <router-view />
        </v-main>
    </v-app>
</template>

<script>

export default {
    name: 'App',

    data: () => ({
        drawer: false,
        group: null,
        items: [
            { title: 'Home', icon: 'mdi-castle', path: '/' },
            { title: 'Scenarios', icon: 'mdi-biohazard', path: '/scenarios' },
            {
                title: 'Response Plans',
                icon: 'mdi-floor-plan',
                path: '/plans',
            },
        ],
    }),
    watch: {
        group() {
            this.drawer = false;
        },
    },
};
</script>

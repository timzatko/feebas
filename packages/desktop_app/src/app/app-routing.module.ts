import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ProjectComponent } from './components/project/project.component';
import { ConfigStatusComponent } from './components/config-status/config-status.component';

const routes: Routes = [
    {
        path: 'project',
        component: ProjectComponent,
    },
    {
        path: 'config-status',
        component: ConfigStatusComponent,
    },
    {
        path: 'home',
        component: HomeComponent,
    },
    {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: false })],
    exports: [RouterModule],
})
export class AppRoutingModule {}

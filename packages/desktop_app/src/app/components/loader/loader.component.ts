import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { LoaderService } from '../../services/loader.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-loader',
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.scss'],
})
export class LoaderComponent implements OnInit, OnDestroy {
    private subscription: Subscription;

    protected message: string;

    constructor(public loaderService: LoaderService, public cd: ChangeDetectorRef) {}

    ngOnInit() {
        this.subscription = this.loaderService._message.asObservable().subscribe(message => {
            this.message = message;

            this.cd.detectChanges();
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

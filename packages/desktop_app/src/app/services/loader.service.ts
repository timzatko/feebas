import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable()
export class LoaderService {
    _loading = new BehaviorSubject<boolean>(false);
    _message = new BehaviorSubject<string>(null);

    set loading(value: boolean) {
        this._loading.next(value);
    }

    get loading() {
        return this._loading.value;
    }

    set message(value: string) {
        this._message.next(value);
    }

    get message() {
        return this._message.value;
    }
}

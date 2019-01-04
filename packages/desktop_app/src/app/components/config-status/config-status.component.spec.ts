import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigStatusComponent } from './config-status.component';

describe('ConfigStatusComponent', () => {
    let component: ConfigStatusComponent;
    let fixture: ComponentFixture<ConfigStatusComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ConfigStatusComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfigStatusComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

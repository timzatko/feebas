import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreenshotItemComponent } from './screenshot-item.component';

describe('ScreenshotItemComponent', () => {
    let component: ScreenshotItemComponent;
    let fixture: ComponentFixture<ScreenshotItemComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ScreenshotItemComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ScreenshotItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

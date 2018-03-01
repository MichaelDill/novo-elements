// NG2
import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ViewContainerRef, AfterViewInit, ElementRef } from '@angular/core';
// APP
import { Helpers } from './../../utils/Helpers';
import { ComponentUtils } from './../../utils/component-utils/ComponentUtils';
import { NovoFieldset, NovoFormGroup } from './FormInterfaces';

@Component({
    selector: 'novo-fieldset-header',
    template: `
        <h6><i [class]="icon || 'bhi-section'"></i>{{title}}</h6>
    `
})
export class NovoFieldsetHeaderElement {
    @Input() title: string;
    @Input() icon: string;
}

@Component({
    selector: 'novo-control-custom',
    template: `
        <span #ref></span>
    `
})
export class NovoControlCustom implements OnInit {
    @Input() control: any;
    @Input() form: any;

    @ViewChild('ref', { read: ViewContainerRef }) referencePoint: ViewContainerRef;

    controlComponent: any;

    constructor(private componentUtils: ComponentUtils) { }

    ngOnInit() {
        this.controlComponent = this.componentUtils.appendNextToLocation(this.control.customControl, this.referencePoint);
        this.controlComponent.instance.control = this.control;
        this.controlComponent.instance.form = this.form;
        if (this.control.customControlConfig) {
            this.controlComponent.instance.config = this.control.customControlConfig;
        }
    }
}

@Component({
    selector: 'novo-fieldset',
    template: `
        <div class="novo-fieldset-container">
            <novo-fieldset-header [icon]="icon" [title]="title" *ngIf="title"></novo-fieldset-header>
            <ng-container *ngFor="let control of controls;let controlIndex = index;">
                <div class="novo-form-row" [class.disabled]="control.disabled" *ngIf="control.__type !== 'GroupedControl'">
                    <novo-control *ngIf="!control.customControl" [autoFocus]="autoFocus && index === 0 && controlIndex === 0" [control]="control" [form]="form"></novo-control>
                    <novo-control-custom *ngIf="control.customControl" [control]="control" [form]="form"></novo-control-custom>
                </div>
                <div *ngIf="control.__type === 'GroupedControl'">TODO - GroupedControl</div>
            </ng-container>
        </div>
    `
})
export class NovoFieldsetElement {
    @Input() controls: Array<any> = [];
    @Input() form: any;
    @Input() title: string;
    @Input() icon: string;
    @Input() index: number;
    @Input() autoFocus: boolean;
}

@Component({
    selector: 'novo-dynamic-form',
    template: `
        <div class="novo-form-container">
            <header>
                <ng-content select="form-title"></ng-content>
                <ng-content select="form-subtitle"></ng-content>
            </header>
            <novo-tiles [options]="fieldOptions" (onChange)="fieldSelect($event)" [defaultValue]="fieldView"></novo-tiles>
            <i class="bhi-sort-asc" (click)="topFunction()"></i>
            <form class="novo-form" [formGroup]="form">
                <ng-container *ngFor="let fieldset of form.fieldsets;let i = index">
                    <novo-fieldset *ngIf="fieldset.controls.length" [index]="i" [autoFocus]="autoFocusFirstField" [icon]="fieldset.icon" [controls]="fieldset.controls" [title]="fieldset.title" [form]="form"></novo-fieldset>
                </ng-container>
            </form>
        </div>
    `
})
export class NovoDynamicFormElement implements OnChanges, OnInit {
    @Input() controls: Array<any> = [];
    @Input() fieldsets: Array<NovoFieldset> = [];
    @Input() form: NovoFormGroup;
    @Input() layout: string;
    @Input() hideNonRequiredFields: boolean = true;
    @Input() autoFocusFirstField: boolean = false;

    allFieldsRequired = false;
    allFieldsNotRequired = false;
    showingAllFields = false;
    showingRequiredFields = true;
    numControls = 0;
    public fieldOptions: any = [{
        label: 'All Fields',
        value: 'all',
      }, {
        label: 'Required Fields',
        value: 'required'}, ];
    public fieldView: string;

    constructor(private element: ElementRef) { }

    public ngOnInit(): void {
        this.ngOnChanges();
        this.fieldView = 'all';
    }

    public ngOnChanges(changes?: SimpleChanges): void {
        this.form.layout = this.layout;

        if (!(this.fieldsets && this.fieldsets.length) && this.controls && this.controls.length) {
            this.fieldsets = [{
                controls: this.controls
            }];
            this.numControls = this.controls.length;
        } else if (this.fieldsets) {
            this.fieldsets.forEach(fieldset => {
                this.numControls = this.numControls + fieldset.controls.length;
            });
        }

        let requiredFields: Array<any> = [];
        let nonRequiredFields: Array<any> = [];
        this.fieldsets.forEach(fieldset => {
            fieldset.controls.forEach(control => {
                if (control.required) {
                    requiredFields.push(control);
                } else {
                    nonRequiredFields.push(control);
                }
            });
        });
        this.allFieldsRequired = requiredFields.length === this.numControls;
        this.allFieldsNotRequired = nonRequiredFields.length === this.numControls;
        if (this.allFieldsNotRequired && this.hideNonRequiredFields) {
            this.fieldsets.forEach(fieldset => {
                fieldset.controls.forEach(control => {
                    this.form.controls[control.key].hidden = false;
                });
            });
        }
        this.form.fieldsets = [...this.fieldsets];
    }

    public topFunction() {
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }
    public fieldSelect(data) {
        if (data === 'required') {
           this.showOnlyRequired(true);
        } else {
            this.showAllFields();
        }
    }

    public showAllFields(): void {
        this.form.fieldsets.forEach(fieldset => {
            fieldset.controls.forEach(control => {
                this.form.controls[control.key].hidden = false;
            });
        });
        this.showingAllFields = true;
        this.showingRequiredFields = false;
        let controls: HTMLElement[] = this.element.nativeElement.querySelectorAll('novo-control:not(.hidden)');
        if (controls && controls.length) {
            let firstControl: HTMLElement = controls[0];
            let input: HTMLElement = firstControl.querySelector('input');
            if (input) {
                input.focus();
            }
        }
    }

    public showOnlyRequired(hideRequiredWithValue): void {
        this.form.fieldsets.forEach(fieldset => {
            fieldset.controls.forEach(control => {
                // Hide any non-required fields
                if (!control.required) {
                    this.form.controls[control.key].hidden = true;
                }

                // Hide required fields that have been successfully filled out
                if (hideRequiredWithValue && !Helpers.isBlank(this.form.value[control.key])) {
                    this.form.controls[control.key].hidden = true;
                }

                // Don't hide fields with errors
                if (this.form.controls[control.key].errors) {
                    this.form.controls[control.key].hidden = false;
                }
            });
        });
        this.showingAllFields = false;
        this.showingRequiredFields = true;
        let controls: HTMLElement[] = this.element.nativeElement.querySelectorAll('novo-control:not(.hidden)');
        if (controls && controls.length) {
            let firstControl: HTMLElement = controls[0];
            let input: HTMLElement = firstControl.querySelector('input');
            if (input) {
                input.focus();
            }
        }
        this.forceValidation();
    }

    get values() {
        return this.form ? this.form.value : null;
    }

    get isValid() {
        return this.form ? this.form.valid : false;
    }

    public updatedValues(): any {
        let ret = null;
        this.form.fieldsets.forEach(fieldset => {
            fieldset.controls.forEach(control => {
                if (this.form.controls[control.key].dirty || control.dirty) {
                    if (!ret) {
                        ret = {};
                    }
                    ret[control.key] = this.form.value[control.key];
                }
            });
        });
        return ret;
    }

    public forceValidation(): void {
        Object.keys(this.form.controls).forEach((key: string) => {
            let control: any = this.form.controls[key];
            if (control.required && Helpers.isBlank(this.form.value[control.key])) {
                control.markAsDirty();
                control.markAsTouched();
            }
        });
    }
}
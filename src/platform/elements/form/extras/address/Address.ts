// NG2
import { Component, forwardRef, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
// APP
import { getCountries, getStates, getStateObjects, findByCountryName, findByCountryId } from '../../../../utils/countries/Countries';
import { NovoLabelService } from '../../../../services/novo-label-service';
import { GooglePlacesService } from '../../../places/places.service';

// Value accessor for the component (supports ngModel)
const ADDRESS_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => NovoAddressElement),
    multi: true
};

@Component({
    selector: 'novo-address',
    providers: [ADDRESS_VALUE_ACCESSOR],
    template: `
        <input id="autocomplete" placeholder="Enter your address" [(ngModel)]="searchTerm" (ngModelChange)="onSearch($event)" type="text"/>
        <div class="googleList">
            <div *ngFor="let item of items" class="googleListItem" (click)="setAddress(item.description, item.place_id)">
                <b>{{ item.structured_formatting.main_text }}</b><br />
                {{ item.structured_formatting.secondary_text }}
            </div>
        </div>
        <input type="text" class="street-address" id="address1" name="address1" [placeholder]="labels.address" autocomplete="shipping street-address address-line-1" [(ngModel)]="model.address1" (ngModelChange)="updateControl()"/>
        <input type="text" class="apt suite" id="address2" name="address2" [placeholder]="labels.apt" autocomplete="shipping address-line-2" [(ngModel)]="model.address2" (ngModelChange)="updateControl()"/>
        <input type="text" class="city locality" id="city" name="city" [placeholder]="labels.city" autocomplete="shipping city locality" [(ngModel)]="model.city" (ngModelChange)="updateControl()"/>
        <novo-select class="state region" id="state" [options]="states" [placeholder]="labels.state" autocomplete="shipping region" [(ngModel)]="model.state" (ngModelChange)="onStateChange($event)"></novo-select>
        <input type="text" class="zip postal-code" id="zip" name="zip" [placeholder]="labels.zipCode" autocomplete="shipping postal-code" [(ngModel)]="model.zip" (ngModelChange)="updateControl()"/>
        <novo-select class="country-name" id="country" [options]="countries" [placeholder]="labels.country" autocomplete="shipping country" [(ngModel)]="model.countryName" (ngModelChange)="onCountryChange($event)"></novo-select>
    `
})
export class NovoAddressElement implements ControlValueAccessor, OnInit {
    states: Array<any> = [];
    countries: Array<any> = getCountries();

    model: any;
    onModelChange: Function = () => {
    };
    onModelTouched: Function = () => {
    };

    searchTerm: any;
    items: any[];

    constructor(public labels: NovoLabelService, public googlePlacesService: GooglePlacesService) { }

    ngOnInit() {
        if (this.model) {
            this.writeValue(this.model);
            this.updateControl();
        } else if (!this.model) {
            this.model = {};
        }
    }

    onCountryChange(evt) {
        let country: any = findByCountryName(evt);
        if (country) {
            this.model.countryName = country.name;
            this.model.countryCode = country.code;
            this.model.countryID = country.id;
            this.updateStates();
        }

        // Update state
        this.model.state = undefined;
        this.updateControl();
    }

    onStateChange(evt) {
        this.model.state = evt;
        this.updateControl();
    }

    onSearch(event: any): void {
        if (event) {
            let _tempParams: any = {
                query: event,
                countryRestriction: '',
                geoTypes: [],
            };
            this.googlePlacesService.getGeoPrediction(_tempParams).then((result: any) => {
                this.items = result ? result : [];
            });
        } else {
            this.items = [];
        }
    }

    setAddress(address: string, placesId: string): void {
        this.items = [];
        this.googlePlacesService.getGeoPlaceDetail(placesId).then((details: any) => {
        for (let i = 0; i < details.address_components.length; i++) {
            let addressType: string = details.address_components[i].types[0];
            switch (addressType) {
                case 'street_number':
                    this.model.address1 = details.address_components[i].long_name;
                    break;
                case 'route':
                    this.model.address1 = this.model.address1 + ' ' + details.address_components[i].long_name;
                    break;
                case 'locality':
                    this.model.city = details.address_components[i].long_name;
                    break;
                case 'administrative_area_level_1':
                    this.model.state = details.address_components[i].short_name;
                    break;
                case 'country':
                    this.model.countryName = details.address_components[i].long_name;
                    // this.onCountryChange();
                    break;
                case 'postal_code':
                    this.model.zip = details.address_components[i].short_name;
                    break;
                default:
                break;
            }
            this.updateControl();
        }
        });
    }

    updateStates() {
        if (this.model.countryName) {
            this.states = getStates(this.model.countryName);
        } else {
            this.states = [];
        }
    }

    updateControl() {
        this.onModelChange(this.model);
    }

    writeValue(model: any): void {
        if (model) {
            let countryName;
            if (model.countryName) {
                countryName = model.countryName;
            } else if (model.countryID) {
                let country: any = findByCountryId(model.countryID);
                if (country) {
                    countryName = country.name;
                };
            }
            if (countryName) {
                countryName = countryName.trim();
                model.state = model.state || '';
                let stateObj: any = getStateObjects(countryName).find(state => {
                    return state.code === model.state.replace(/\W+/g, '').toUpperCase() || state.name === model.state;
                }) || {};
                this.model = Object.assign(model, { countryName: countryName, state: stateObj.name });
                this.updateStates();
            }
        }
    }

    registerOnChange(fn: Function): void {
        this.onModelChange = fn;
    }

    registerOnTouched(fn: Function): void {
        this.onModelTouched = fn;
    }
}
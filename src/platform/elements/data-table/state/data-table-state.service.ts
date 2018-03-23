import { EventEmitter } from '@angular/core';

import { IDataTableChangeEvent, IDataTableSortFilter } from '../interfaces';

export class DataTableState {
  id: number = Math.random();
  sort: { id: string; value: string } = undefined;
  filter: { id: string; value: string } = undefined;
  page: number = 0;
  pageSize: number = undefined;
  globalSearch: string = undefined;
  selectedRows: Map<string, object> = new Map<string, object>();
  outsideFilter: any;

  updates: EventEmitter<IDataTableChangeEvent> = new EventEmitter<IDataTableChangeEvent>();
  onReset: EventEmitter<boolean> = new EventEmitter<boolean>();

  get userFiltered(): boolean {
    return !!(this.filter || this.sort || this.globalSearch || this.outsideFilter);
  }

  public reset(fireUpdate: boolean = true, persistUserFilters?: boolean): void {
    if (!persistUserFilters) {
      this.sort = undefined;
      this.globalSearch = undefined;
      this.filter = undefined;
    }
    this.page = 0;
    this.selectedRows.clear();
    this.onReset.emit(true);
    if (fireUpdate) {
      this.updates.emit({
        sort: this.sort,
        filter: this.filter,
        globalSearch: this.globalSearch,
      });
    }
  }
}

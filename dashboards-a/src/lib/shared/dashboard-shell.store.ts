import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';

interface DashboardShellState {
  filterOpen: boolean;
  editMode: boolean;
}

@Injectable()
export class DashboardShellStore extends ComponentStore<DashboardShellState> {
  constructor() {
    super({ filterOpen: false, editMode: false });
  }

  readonly filterOpen$ = this.select((state) => state.filterOpen);
  readonly editMode$ = this.select((state) => state.editMode);

  readonly toggleFilter = this.updater((state) => ({
    ...state,
    filterOpen: !state.filterOpen,
  }));

  readonly setEditMode = this.updater((state, editMode: boolean) => ({
    ...state,
    editMode,
  }));
}


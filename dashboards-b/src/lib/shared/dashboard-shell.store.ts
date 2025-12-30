import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';

interface DashboardShellState {
  filterOpen: boolean;
  editMode: boolean;
  modeRegleur?: boolean;
}

@Injectable()
export class DashboardShellStore extends ComponentStore<DashboardShellState> {
  constructor() {
    super({ filterOpen: false, editMode: false });
  }

  readonly filterOpen$ = this.select((state) => state.filterOpen);
  readonly editMode$ = this.select((state) => state.editMode);
  readonly modeRegleur = this.selectSignal((state) => state.modeRegleur);

  readonly toggleFilter = this.updater((state) => ({
    ...state,
    filterOpen: !state.filterOpen,
  }));

  readonly setEditMode = this.updater((state, editMode: boolean) => ({
    ...state,
    editMode,
  }));

  readonly setModeRegleur = this.updater((state, modeRegleur?: boolean) => ({
    ...state,
    modeRegleur,
  }));
}

import { Component, computed, DestroyRef, Inject, OnInit, TemplateRef } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import {
  EnvironmentService,
  exportSceneBlob,
  ITrigramme,
  MyUserService,
  RoleService,
  toDateFormat,
  TRIGRAMME,
} from '@portals/base/core/core-component';
import {
  DateParameters,
  ISuiviArrivageLotFilters,
  SuiviArrivageLotClient,
  SuiviArrivageLotFilters,
} from '@portals/client-reporting';
import { DataStateChangeEvent, KENDO_GRID } from '@progress/kendo-angular-grid';
import { BehaviorSubject, take } from 'rxjs';

import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { GridPersistanceDirective } from '@portals/base/core/directives';
import { DateLongPipe } from '@portals/base/core/pipes';
import { AppModeService } from '@portals/base/core/shared-services';
import { RoleEnum } from '@portals/client-identity';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { WindowService } from '@progress/kendo-angular-dialog';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';
import { fileExcelIcon } from '@progress/kendo-svg-icons';
import { finalize } from 'rxjs/operators';
import { DashboardFields } from '../../../dashboard-model';
import { SuiviArrivageLotService } from '../../services/suivi-arrivage-lot.data.service';
import { SuiviArrivageService } from '../../services/suivi-arrivage-lot.service';

// interface non utilisée
// interface IFilterRequest {
//   filters: ISuiviArrivageLotFilters
// }

@Component({
  selector: 'portals-sixth-tab',
  templateUrl: './sixth-tab.component.html',
  styleUrls: ['./sixth-tab.component.scss'],
  imports: [KENDO_TILELAYOUT, KENDO_BUTTON, KENDO_GRID, AsyncPipe, GridPersistanceDirective, DateLongPipe],
})
export class SixthTabComponent implements OnInit {
  public isInterne: boolean | undefined;

  hide: BehaviorSubject<boolean>[] = Array.from({ length: 1 }).map((x) => new BehaviorSubject<boolean>(false));
  PGD = toSignal(this.myUser.hasLevel('PGD', 2));
  CDA = toSignal(this.myUser.hasLevel('CDA', 2));
  PSD = toSignal(this.myUser.hasLevel('PSD', 2));

  hasAccess = computed(() => {
    switch (this.roleService.currentRole()) {
      case RoleEnum.Intranet:
        return this.CDA();
      case RoleEnum.Gestionnaire:
        return this.PGD();
      case RoleEnum.Souscripteur:
        return this.PSD();
      default:
        return false;
    }
  });
  appMode = this.appModeService.appMode;

  constructor(
    private suiviArrivageLotClient: SuiviArrivageLotClient,
    public suiviArrivageService: SuiviArrivageService,
    public suiviArrivageLotService: SuiviArrivageLotService,
    @Inject(TRIGRAMME) protected trigramme: ITrigramme,
    private env: EnvironmentService,
    private windowService: WindowService,
    private destroyRef: DestroyRef,
    private appModeService: AppModeService,
    private myUser: MyUserService,
    private roleService: RoleService
  ) {
    this.isInterne = this.env.activePortalClient === 'portail-souscripteur' ? false : true;
  }

  editMode = false;

  expandCard(container: TemplateRef<any>, text: string) {
    this.windowService.open({
      height: 600,
      width: 1000,
      title: text,
      state: 'maximized',
      resizable: false,
      content: container,
    });
  }

  public getField(name: string): UntypedFormControl {
    return <UntypedFormControl>this.suiviArrivageService.formFilter.get(name);
  }

  ngOnInit(): void {
    this.suiviArrivageLotService.reset();
    this.suiviArrivageService.suiviArrivageFilters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryObject: ISuiviArrivageLotFilters | null) => {
        if (queryObject == null) return;
        // variable non utilisée
        // let query = {
        //   filters: queryObject
        // };
        this.updateSuiviArrivageLots(queryObject);
      });
  }

  //DEBUT GRILLE SUIVI ARRIVGE LOT

  public raffrachirSuiviArrivageLots(): void {
    this.suiviArrivageLotService.refresh(this.getFilter());
  }

  public dataStateChangeSuiviArrivageLots(state: DataStateChangeEvent): void {
    this.suiviArrivageLotService.state = state;
    this.suiviArrivageLotService.read(this.getFilter());
  }

  updateSuiviArrivageLots(query: ISuiviArrivageLotFilters): void {
    this.suiviArrivageLotService.refresh(query);
  }

  isExporting: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportDetailSuiviLot(): void {
    const exportDetailSuiviLot = SuiviArrivageLotFilters.fromJS(this.getFilter());
    this.isExporting.next(true);
    this.suiviArrivageLotClient
      .exportDetailSuiviLot(this.isInterne, '1.0', exportDetailSuiviLot)
      .pipe(
        take(1),
        finalize(() => this.isExporting.next(false))
      )
      .subscribe((s) => {
        s.fileName = s.fileName === undefined ? 'export' : s.fileName;
        exportSceneBlob(s);
      });
  }

  //FIN GRILLE SUIVI ARRIVGE LOT

  public getFilter(): ISuiviArrivageLotFilters {
    let startDate = <unknown>toDateFormat(this.getField(DashboardFields.StartingDate).value);
    let endDate = <unknown>toDateFormat(this.getField(DashboardFields.EndDate).value);

    if (this.suiviArrivageService.filterForToday.getValue()) {
      startDate = new Date();
      endDate = new Date();
    }
    return <ISuiviArrivageLotFilters>{
      souscripteurs: this.getField(DashboardFields.Souscripteur).value,
      numeroLots: this.getField(DashboardFields.NumeroLot).value,
      polices: this.getField(DashboardFields.Police).value,
      ecarts: this.getField(DashboardFields.Ecart).value,
      totalSaisies: this.getField(DashboardFields.TotalSaisie).value,
      etatLots: this.getField(DashboardFields.EtatLot).value,
      filtrePolice: this.trigramme.authority === 'EBM' ? this.suiviArrivageService.filterByPolice.getValue() : true,
      filtreNC: this.trigramme.authority === 'AZM' ? this.suiviArrivageService.filterByNextcare.getValue() : false,
      dateParameters: <DateParameters>{
        startingDate: startDate,
        endDate: endDate,
      },
    };
  }

  protected readonly fileExcelIcon = fileExcelIcon;
}

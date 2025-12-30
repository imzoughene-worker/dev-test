import { AsyncPipe } from '@angular/common';
import { Component, computed, DestroyRef, Inject, OnInit, TemplateRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { UntypedFormControl } from '@angular/forms';
import {
  exportSceneBlob,
  ITrigramme,
  MyUserService,
  RoleService,
  toDateFormat,
  TRIGRAMME,
} from '@portals/base/core/core-component';
import { GridPersistanceDirective } from '@portals/base/core/directives';
import { DateLongPipe } from '@portals/base/core/pipes';
import { RoleEnum } from '@portals/client-identity';
import {
  DateParameters,
  ISuiviSinistreFilters,
  MetricDto,
  SuiviSinistreClient,
  SuiviSinistreFilters,
} from '@portals/client-reporting';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { WindowService } from '@progress/kendo-angular-dialog';
import { DataStateChangeEvent, KENDO_GRID } from '@progress/kendo-angular-grid';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';
import { fileExcelIcon, fullscreenIcon } from '@progress/kendo-svg-icons';
import { BehaviorSubject, take } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { MetricChartComponent } from '../../../charts/metric-chart/metric-chart.component';
import { DashboardFields } from '../../../dashboard-model';
import { AccordPrealableService } from '../../services/accord-prealable.data.service';
import { SuiviSinistreService } from '../../services/suivi-sinistre.service';

interface IFilterRequest {
  filters: ISuiviSinistreFilters;
}

@Component({
  selector: 'portals-eighteenth-tab',
  templateUrl: './eighteenth-tab.component.html',
  styleUrls: ['./eighteenth-tab.component.scss'],
  imports: [
    KENDO_TILELAYOUT,
    KENDO_BUTTON,
    MetricChartComponent,
    KENDO_GRID,
    GridPersistanceDirective,
    AsyncPipe,
    DateLongPipe,
  ],
})
export class EighteenthTabComponent implements OnInit {
  editMode = false;
  hide: BehaviorSubject<boolean>[] = Array.from({ length: 3 }).map((x) => new BehaviorSubject<boolean>(false));
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

  constructor(
    public suiviSinistreService: SuiviSinistreService,
    public suiviSinistreClient: SuiviSinistreClient,
    public accordPrealableService: AccordPrealableService,
    @Inject(TRIGRAMME) protected trigramme: ITrigramme,
    public windowService: WindowService,
    private destroyRef: DestroyRef,
    private myUser: MyUserService,
    private roleService: RoleService
  ) {}

  public getField(name: string): UntypedFormControl {
    return <UntypedFormControl>this.suiviSinistreService.formFilter.get(name);
  }

  ngOnInit(): void {
    this.accordPrealableService.reset();
    this.suiviSinistreService.suiviSinistreFilters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryObject: ISuiviSinistreFilters | null) => {
        if (queryObject == null) return;
        const query = {
          filters: queryObject,
        };
        this.updateTotalAccordPrealable(queryObject);
        this.updateSuiviAccordPrealable(queryObject);
        this.updateTotalExecutionAP(query);
      });
  }

  //TotalExecutionAP
  TotalExecutionAPIsLoading = false;
  TotalExecutionAPMetric: MetricDto | null = null;

  updateTotalExecutionAP(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTotalExecutionAP('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.TotalExecutionAPIsLoading = true)),
        finalize(() => (this.TotalExecutionAPIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.TotalExecutionAPMetric = s;
      });
  }

  //TotalAccordPrealable
  totalAccordPrealableIsLoading = false;
  totalAccordPrealableMetric: MetricDto | null = null;

  updateTotalAccordPrealable(query: ISuiviSinistreFilters): void {
    this.suiviSinistreClient
      .getTotalAccordPrealable('1.0', SuiviSinistreFilters.fromJS({ ...query, etatClients: [] }))
      .pipe(
        tap(() => (this.totalAccordPrealableIsLoading = true)),
        finalize(() => (this.totalAccordPrealableIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalAccordPrealableMetric = s;
      });
  }

  //DEBUT GRILLE ACCORD PREALABLE

  public raffrachirSuiviAccordPrealable(): void {
    this.accordPrealableService.refresh(this.getFilter());
  }

  public dataStateChangeSuiviAccordPrealable(state: DataStateChangeEvent): void {
    this.accordPrealableService.state = state;
    this.accordPrealableService.read(this.getFilter());
  }

  updateSuiviAccordPrealable(query: ISuiviSinistreFilters): void {
    this.accordPrealableService.refresh(query);
  }

  isExporting: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportAccordPrealable(): void {
    const exportAccordPrealable = SuiviSinistreFilters.fromJS({ ...this.getFilter(), etatClients: [] });
    this.isExporting.next(true);
    this.suiviSinistreClient
      .exportSuiviAccordPrealable('1.0', exportAccordPrealable)
      .pipe(
        take(1),
        finalize(() => this.isExporting.next(false))
      )
      .subscribe((s) => {
        s.fileName = s.fileName === undefined ? 'export' : s.fileName;
        exportSceneBlob(s);
      });
  }

  //FIN GRILLE ACCORD PREALABLE
  public getFilter(): ISuiviSinistreFilters {
    let startDate = <unknown>toDateFormat(this.getField(DashboardFields.StartingDate).value!);
    let endDate = <unknown>toDateFormat(this.getField(DashboardFields.EndDate).value!);

    if (this.suiviSinistreService.filterForToday.getValue()) {
      startDate = new Date();
      endDate = new Date();
    }
    return <ISuiviSinistreFilters>{
      souscripteurs: this.getField(DashboardFields.Souscripteur).value,
      numeroLots: this.getField(DashboardFields.NumeroLot).value,
      polices: this.getField(DashboardFields.Police).value,
      adherents: this.getField(DashboardFields.Adherent).value,
      numeroDeclarations: this.getField(DashboardFields.NumeroDeclaration).value,
      etats: this.getField(DashboardFields.Etat).value,
      filtrePolice: this.trigramme.authority === 'EBM' ? this.suiviSinistreService.filterByPolice.getValue() : true,
      filtreNC: this.trigramme.authority === 'AZM' ? this.suiviSinistreService.filterByNextcare.getValue() : false,
      dateParameters: <DateParameters>{
        startingDate: startDate,
        endDate: endDate,
      },
    };
  }

  protected readonly fileExcelIcon = fileExcelIcon;
  protected readonly fullscreenIcon = fullscreenIcon;
}
